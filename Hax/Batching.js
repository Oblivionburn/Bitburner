import {colors,DTStamp} from "./Hax/UI.js";
import * as DB from "./Hax/Databasing.js";

let available_servers = [];
let targets = [];
let batches_running = [];
let grow_running = [];
let weaken_running = [];
let hack_running = [];
let growThreshFactor = 0.1;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");
    ns.clearLog();
    
    while (true)
    {
        available_servers = await DB.Select(ns, "available_servers");
        targets = await DB.Select(ns, "targets");

        await Batching(ns, targets);
        await ns.sleep(1);
    }
}

/** @param {NS} ns */
async function Batching(ns, targets)
{
    if (targets != null &&
        targets.length > 0)
    {
        let availableCount = await AvailableCount();
        if (availableCount > 0)
        {
            let target = targets[0];

            for (let scale = 1; scale > 0; scale -= 0.1)
            {
                let sent = false;
                
                let money = ns.getServerMoneyAvailable(target);
                let maxMoney = ns.getServerMaxMoney(target);
                let security = ns.getServerSecurityLevel(target);
                let minSecurity = ns.getServerMinSecurityLevel(target);
                let growThresh = maxMoney * growThreshFactor;

                let prepped = await IsServerPrepped(ns, security, minSecurity, money, growThresh);
                if (prepped)
                {
                    let Batch = await CreateBatch(ns, target, security, minSecurity, money, maxMoney, scale);
                    if (Batch != null)
                    {
                        sent = await SendBatch(ns, Batch);
                    }
                }
                else
                {
                    if (security > minSecurity)
                    {
                        let Weaken = await WeakenOrder(ns, 0, target, security, minSecurity, scale);
                        if (Weaken.Threads > 0)
                        {
                            sent = await SendWeaken(ns, Weaken);
                        }
                    }
                    else if (money < growThresh)
                    {
                        let Grow = await GrowOrder(ns, 0, target, money, maxMoney, scale);
                        if (Grow.Threads > 0)
                        {
                            sent = await SendGrow(ns, Grow);
                        }
                    }
                }

                if (sent)
                {
                    break;
                }
            }
        }
    }
}

/** @param {NS} ns */
async function CreateBatch(ns, target, security, minSecurity, money, maxMoney, scale)
{
    //Time diff between batches = 400ms
    let Hack = await HackOrder(ns, 0, target, maxMoney, scale);
    let hackSecurityIncrease = security + Hack.SecurityDiff;
    let moneyStolen = (money * (Hack.PercentStolen * Hack.Threads)) / 100;

    let WeakenOne = await WeakenOrder(ns, 0, target, hackSecurityIncrease, minSecurity, scale);

    let Grow = await GrowOrder(ns, 0, target, money - moneyStolen, maxMoney, scale);
    let growSecurityIncrease = security + Grow.SecurityDiff;

    //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Grow Security: " + growSecurityIncrease}`);
    let WeakenTwo = await WeakenOrder(ns, 200, target, security + growSecurityIncrease, minSecurity, scale);

    Grow.Delay = (WeakenOne.Time - ns.getGrowTime(target)) + 100;
    Hack.Delay = (WeakenOne.Time - ns.getHackTime(target)) - 100;

    if (WeakenOne.Threads > 0 &&
        WeakenTwo.Threads > 0 &&
        Grow.Threads > 0 &&
        Hack.Threads > 0)
    {
        let orders = [];
        orders.push(WeakenOne);
        orders.push(WeakenTwo);
        orders.push(Grow);
        orders.push(Hack);

        let totalCost = WeakenOne.Cost + WeakenTwo.Cost + Grow.Cost + Hack.Cost;
        let endTime = Date.now() + WeakenOne.Time + 200;

        let batch =
        {
            Host: "",
            Target: target,
            StartTime: Date.now(),
            EndTime: endTime,
            Cost: totalCost,
            Orders: orders
        }

        return batch;
    }
    
    return null;
}

/** @param {NS} ns */
async function GrowOrder(ns, delay, target, money, maxMoney, scale)
{
    let growThresh = maxMoney * growThreshFactor;
    let growMulti = growThresh;
    if (money > 0)
    {
        growMulti = growThresh / money;
    }

    let script = "/Hax/Grow.js";
    let threads = Math.ceil(ns.growthAnalyze(target, 1 + Math.ceil(growMulti), 1) * scale);
    let securityDiff = ns.growthAnalyzeSecurity(threads, target, 1);
    let time = ns.getGrowTime(target);
    let cost = await GetCost(ns, script, threads);

    let order =
    {
        Target: target,
        Delay: delay,
        StartTime: Date.now(),
        EndTime: Date.now() + time,
        Time: time,
        Cost: cost,
        Script: script,
        Threads: threads,
        SecurityDiff: securityDiff
    }

    return order;
}

/** @param {NS} ns */
async function WeakenOrder(ns, delay, target, security, minSecurity, scale)
{
    let script = "/Hax/Weaken.js";
    let baseWeakenAmount = ns.weakenAnalyze(1, 1);
    let time = ns.getWeakenTime(target);
    let securityReduce = security - minSecurity;
    let threads = Math.ceil((securityReduce / baseWeakenAmount) * scale);
    let cost = await GetCost(ns, script, threads);

    let order =
    {
        Target: target,
        Delay: delay,
        StartTime: Date.now(),
        EndTime: Date.now() + time,
        Time: time,
        Cost: cost,
        Script: script,
        Threads: threads
    }

    return order;
}

/** @param {NS} ns */
async function HackOrder(ns, delay, target, maxMoney, scale)
{
    let growThresh = maxMoney * growThreshFactor;

    let script = "/Hax/Hack.js";
    let threads = Math.ceil(ns.hackAnalyzeThreads(target, growThresh) * scale);
    let percentStolen = ns.hackAnalyze(target);
    let securityDiff = ns.hackAnalyzeSecurity(threads, target);
    let time = ns.getHackTime(target);
    let cost = await GetCost(ns, script, threads);

    let order =
    {
        Target: target,
        Delay: delay,
        StartTime: Date.now(),
        EndTime: Date.now() + time,
        Time: time,
        Cost: cost,
        Script: script,
        Threads: threads,
        SecurityDiff: securityDiff,
        PercentStolen: percentStolen
    }

    return order;
}

/** @param {NS} ns */
async function SendBatch(ns, batch)
{
    let availableCount = await AvailableCount();
    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        if (availableRam >= batch.Cost)
        {
            batch.Host = host;

            let isBatchRunning = await IsBatchRunning(batch);
            if (!isBatchRunning)
            {
                let str = JSON.stringify(batch);
                ns.exec("/Hax/RunBatch.js", host, 1, str);

                batches_running.push(batch);
                ns.print(`${colors["white"] + DTStamp() + colors["yellow"] + host + " started batch for " + batch.Target}`);

                return true;
            }
        }
    }

    return false;
}

/** @param {NS} ns */
async function SendGrow(ns, grow)
{
    let availableCount = await AvailableCount();

    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        if (availableRam >= grow.Cost)
        {
            let isGrowRunning = await IsGrowRunning(grow.Target);
            if (!isGrowRunning)
            {
                ns.exec(grow.Script, host, grow.Threads, grow.Target, grow.Delay);
                grow_running.push(grow);
                ns.print(`${colors["white"] + DTStamp() + colors["green"] + host + " started growing " + grow.Target + " with " + grow.Threads + " threads"}`);
                return true;
            }
        }
    }

    return false;
}

/** @param {NS} ns */
async function SendWeaken(ns, weaken)
{
    let availableCount = await AvailableCount();
    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        if (availableRam >= weaken.Cost)
        {
            let isWeakenRunning = await IsWeakenRunning(weaken.Target);
            if (!isWeakenRunning)
            {
                ns.exec(weaken.Script, host, weaken.Threads, weaken.Target, weaken.Delay);
                weaken_running.push(weaken);
                ns.print(`${colors["white"] + DTStamp() + colors["green"] + host + " started weakening " + weaken.Target + " with " + weaken.Threads + " threads"}`);
                return true;
            }
        }
    }

    return false;
}

/** @param {NS} ns */
async function SendHack(ns, hack)
{
    let availableCount = await AvailableCount();
    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        if (availableRam >= hack.Cost)
        {
            let isHackRunning = await IsHackRunning(hack.Target);
            if (!isHackRunning)
            {
                ns.exec(hack.Script, host, hack.Threads, hack.Target, hack.Delay);
                hack_running.push(hack);
                ns.print(`${colors["white"] + DTStamp() + colors["green"] + host + " started hacking " + hack.Target + " with " + hack.Threads + " threads"}`);
                return true;
            }
        }
    }

    return false;
}

async function AvailableCount()
{
    if (available_servers != null)
    {
        return available_servers.length;
    }

    return 0;
}

async function IsServerPrepped(ns, security, minSecurity, money, growThresh)
{
    if (security <= minSecurity)
    {
        if (money >= growThresh)
        {
            return true;
        }
    }

    return false;
}

async function IsBatchRunning(newBatch)
{
    for (let i = 0; i < batches_running.length; i++)
    {
        let Batch = batches_running[i];
        if (Batch.Target == newBatch.Target &&
            Batch.Host == newBatch.Host)
        {
            if (Date.now() > Batch.StartTime + 400)
            {
                batches_running.splice(i, 1);
                i--;
            }
            else if (Date.now() <= Batch.StartTime + 400)
            {
                return true;
            }
        }
    }

    return false;
}

async function IsGrowRunning(target)
{
    for (let i = 0; i < grow_running.length; i++)
    {
        let Grow = grow_running[i];
        if (Grow.Target == target)
        {
            if (Date.now() > Grow.EndTime)
            {
                grow_running.splice(i, 1);
                i--;
            }
            else if (Date.now() <= Grow.EndTime)
            {
                return true;
            }
        }
    }

    return false;
}

async function IsWeakenRunning(target)
{
    for (let i = 0; i < weaken_running.length; i++)
    {
        let Weaken = weaken_running[i];
        if (Weaken.Target == target)
        {
            if (Date.now() > Weaken.EndTime)
            {
                weaken_running.splice(i, 1);
                i--;
            }
            else if (Date.now() <= Weaken.EndTime)
            {
                return true;
            }
        }
    }

    return false;
}

async function IsHackRunning(target)
{
    for (let i = 0; i < hack_running.length; i++)
    {
        let Hack = hack_running[i];
        if (Hack.Target == target)
        {
            if (Date.now() > Hack.EndTime)
            {
                hack_running.splice(i, 1);
                i--;
            }
            else if (Date.now() <= Hack.EndTime)
            {
                return true;
            }
        }
    }

    return false;
}

/** @param {NS} ns */
async function GetCost(ns, script, threads)
{
    return ns.getScriptRam(script) * threads;
}