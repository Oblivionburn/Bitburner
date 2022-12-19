import {colors,DTStamp} from "./Hax/UI.js";
import * as DB from "./Hax/Databasing.js";

let available_servers = [];
let targets = [];
let batches_running = [];
let grow_running = [];
let weaken_running = [];
let hack_running = [];
let growThreshFactor = 0.5;

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
        if (targets != null &&
            targets.length > 0)
        {
            await Batching(ns, targets);
        }
        
        await ns.sleep(1);
    }
}

/** @param {NS} ns */
async function Batching(ns, targets)
{
    let availableCount = await AvailableCount();
    if (availableCount > 0)
    {
        let targetCount = targets.length;
        for (let i = 0; i < 3; i++)
        {
            let target = targets[i];

            let money = ns.getServerMoneyAvailable(target);
            let maxMoney = ns.getServerMaxMoney(target);
            let security = Math.floor(ns.getServerSecurityLevel(target));
            let minSecurity = Math.floor(ns.getServerMinSecurityLevel(target));
            let growThresh = maxMoney * growThreshFactor;

            let prepped = await IsServerPrepped(ns, security, minSecurity, money, growThresh);
            if (prepped)
            {
                //ns.print(`${colors["white"] + DTStamp() + colors["yellow"] + target + " is prepped"}`);
                let Batch = await CreateBatch(ns, target, security, minSecurity, money, maxMoney);
                let Hack = await HackOrder(ns, 0, target, maxMoney);
                await SendBatch(ns, Batch, Hack);
            }
            else
            {
                //ns.print(`${colors["white"] + DTStamp() + colors["red"] + target + " is not prepped"}`);
                if (security > minSecurity)
                {
                    let Weaken = await WeakenOrder(ns, 0, target, security, minSecurity);
                    await SendWeaken(ns, Weaken);
                }
                else if (money < growThresh)
                {
                    let Grow = await GrowOrder(ns, 0, target, money, maxMoney);
                    await SendGrow(ns, Grow);
                }
            }
        }
    }
}

/** @param {NS} ns */
async function CreateBatch(ns, target, security, minSecurity, money, maxMoney)
{
    //Time diff between batches = 400ms

    let WeakenOne = await WeakenOrder(ns, 0, target, security, minSecurity);
    let WeakenTwo = await WeakenOrder(ns, 200, target, security, minSecurity);

    let growDelay = (WeakenOne.Time - ns.getGrowTime(target)) + 100;
    let Grow = await GrowOrder(ns, growDelay, target, money, maxMoney);

    let hackDelay = (WeakenOne.Time - ns.getHackTime(target)) - 100;
    let Hack = await HackOrder(ns, hackDelay, target, maxMoney);

    let orders = [];
    orders.push(WeakenOne);
    orders.push(WeakenTwo);
    orders.push(Grow);
    orders.push(Hack);

    let totalCost = WeakenOne.Cost + WeakenTwo.Cost + Grow.Cost + Hack.Cost;
    let endTime = Date.now() + WeakenOne.Time + 200;

    let batch =
    {
        Target: target,
        StartTime: Date.now(),
        EndTime: endTime,
        Cost: totalCost,
        Orders: orders
    }

    return batch;
}

/** @param {NS} ns */
async function SendBatch(ns, batch, hack)
{
    let availableCount = await AvailableCount();
    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        if (availableRam >= batch.Cost)
        {
            let isBatchRunning = await IsBatchRunning(batch.Target, batch);
            if (!isBatchRunning)
            {
                let str = JSON.stringify(batch);
                ns.exec("/Hax/RunBatch.js", host, 1, str);

                batches_running.push(batch);
                ns.print(`${colors["white"] + DTStamp() + colors["yellow"] + host + " started batch for " + batch.Target}`);
            }
            else
            {
                //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Batch is already running for " + batch.Target}`);
            }
        }
        else
        {
            //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Not enough RAM on " + host + " to start batch against " + batch.Target + " for " + batch.Cost + " GB"}`);
            await SendHack(ns, hack);
        }
    }
}

/** @param {NS} ns */
async function SendGrow(ns, grow)
{
    let availableCount = await AvailableCount();

    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let startingThreads = grow.Threads;

        for (let t = grow.Threads; t > 0; t--)
        {
            let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            if (availableRam >= grow.Cost)
            {
                let isGrowRunning = await IsGrowRunning(grow.Target);
                if (!isGrowRunning)
                {
                    ns.exec(grow.Script, host, grow.Threads, grow.Target, grow.Delay);
                    grow_running.push(grow);
                    ns.print(`${colors["white"] + DTStamp() + colors["green"] + host + " started growing " + grow.Target + " with " + grow.Threads + " threads"}`);
                }
                else
                {
                    //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Grow is already running for " + grow.Target}`);
                }
            }
            else
            {
                //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Not enough RAM on " + host + " to start growing " + grow.Target + " for " + grow.Cost + " GB"}`);
                
                grow.Threads--;
                grow.Cost = await GetCost(ns, grow.Script, grow.Threads);
            }
        }

        grow.Threads = startingThreads;
        grow.Cost = await GetCost(ns, grow.Script, grow.Threads);
    }
}

/** @param {NS} ns */
async function SendWeaken(ns, weaken)
{
    let availableCount = await AvailableCount();
    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let startingThreads = weaken.Threads;

        for (let t = weaken.Threads; t > 0; t--)
        {
            let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            if (availableRam >= weaken.Cost)
            {
                let isWeakenRunning = await IsWeakenRunning(weaken.Target);
                if (!isWeakenRunning)
                {
                    ns.exec(weaken.Script, host, weaken.Threads, weaken.Target, weaken.Delay);
                    weaken_running.push(weaken);
                    ns.print(`${colors["white"] + DTStamp() + colors["green"] + host + " started weakening " + weaken.Target + " with " + weaken.Threads + " threads"}`);
                }
                else
                {
                    //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Weaken is already running for " + weaken.Target}`);
                }
            }
            else
            {
                //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Not enough RAM on " + host + " to start weakening " + weaken.Target + " for " + weaken.Cost + " GB"}`);
                weaken.Threads--;
                weaken.Cost = await GetCost(ns, weaken.Script, weaken.Threads);
            }
        }

        weaken.Threads = startingThreads;
        weaken.Cost = await GetCost(ns, weaken.Script, weaken.Threads);
    }
}

/** @param {NS} ns */
async function SendHack(ns, hack)
{
    let availableCount = await AvailableCount();
    for (let i = 0; i < availableCount; i++)
    {
        let host = available_servers[i];

        let startingThreads = hack.Threads;

        for (let t = hack.Threads; t > 0; t--)
        {
            let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            if (availableRam >= hack.Cost)
            {
                let isHackRunning = await IsHackRunning(hack.Target);
                if (!isHackRunning)
                {
                    ns.exec(hack.Script, host, hack.Threads, hack.Target, hack.Delay);
                    hack_running.push(hack);
                    ns.print(`${colors["white"] + DTStamp() + colors["green"] + host + " started hacking " + hack.Target + " with " + hack.Threads + " threads"}`);
                }
                else
                {
                    //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Hack is already running for " + hack.Target}`);
                }
            }
            else
            {
                //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Not enough RAM on " + host + " to start hacking " + hack.Target + " for " + hack.Cost + " GB"}`);
                hack.Threads--;
                hack.Cost = await GetCost(ns, hack.Script, hack.Threads);
            }
        }

        hack.Threads = startingThreads;
        hack.Cost = await GetCost(ns, hack.Script, hack.Threads);
    }
}

/** @param {NS} ns */
async function GrowOrder(ns, delay, target, money, maxMoney)
{
    let growThresh = maxMoney * growThreshFactor;

    let growMulti = growThresh;
    if (money > 0)
    {
        growMulti = growThresh / money;
    }

    let script = "/Hax/Grow.js";
    let threads = Math.ceil(ns.growthAnalyze(target, Math.ceil(growMulti), 1));
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
        Threads: threads
    }

    return order;
}

/** @param {NS} ns */
async function WeakenOrder(ns, delay, target, security, minSecurity)
{
    let script = "/Hax/Weaken.js";
    let baseWeakenAmount = ns.weakenAnalyze(1, 1);
    let time = ns.getWeakenTime(target);
    let threads = Math.ceil((security - minSecurity) / baseWeakenAmount);
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
async function HackOrder(ns, delay, target, maxMoney)
{
    let growThresh = maxMoney * growThreshFactor;

    let script = "/Hax/Hack.js";
    let threads = Math.ceil(ns.hackAnalyzeThreads(target, growThresh));
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
        Threads: threads
    }

    return order;
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
        else
        {
            //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Money: $" + money.toLocaleString() + ", Grow Thresh: $" + growThresh.toLocaleString()}`);
        }
    }
    else
    {
        //ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Security: " + security + ", Min Security: " + minSecurity}`);
    }

    return false;
}

async function IsBatchRunning(target)
{
    for (let i = 0; i < batches_running.length; i++)
    {
        let Batch = batches_running[i];
        if (Batch.Target == target)
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