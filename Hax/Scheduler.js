import * as DB from "./Hax/Databasing.js";

let available_servers = [];
let rooted_with_money = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
    //ns.tail(ns.getScriptName(), "home");
    
    while (true)
    {
        available_servers = await DB.Select(ns, "available_servers");
        rooted_with_money = await DB.Select(ns, "rooted_with_money");

        await RunSchedules(ns);
        await ns.sleep(1);
    }
}

async function RunSchedules(ns)
{
    if (available_servers != null &&
        rooted_with_money != null)
    {
        let schedules = await CompileSchedules(ns);
        for (let s = 0; s < schedules.length; s++)
        {
            let BatchSchedule = schedules[s];
            let target = BatchSchedule.Target;
            let schedule = BatchSchedule.Schedule;

            await SendBatch(ns, target, schedule);
            await ns.sleep(100);
        }
    }
}

async function CompileSchedules(ns)
{
    let schedules = [];

    if (rooted_with_money != null)
    {
        let serverCount = rooted_with_money.length;
        if (serverCount > 0)
        {
            for (let i = 0; i < serverCount; i++)
            {
                let target = rooted_with_money[i];

                let schedule = await CreateSchedule(ns, target);
                if (schedule.length > 0)
                {
                    schedules.push({Target: target, Schedule: schedule});
                }
            }
        }
    }

    return schedules;
}

async function CreateSchedule(ns, target)
{
    let schedule = [];

    let securityLevel = Math.floor(ns.getServerSecurityLevel(target));
    let minSecurityLevel = Math.floor(ns.getServerMinSecurityLevel(target));

    if (securityLevel <= minSecurityLevel)
    {
        let availableMoney = ns.getServerMoneyAvailable(target);
        let maxMoney = ns.getServerMaxMoney(target) * 0.01;

        if (availableMoney < maxMoney)
        {
            //Server is at minSecurity but needs to be grown to the
            //  moneyThresh before being hacked
            let moneyMulti = 0;
            if (availableMoney > 0)
            {
                moneyMulti = maxMoney / availableMoney;
            }
            else
            {
                moneyMulti = maxMoney;
            }
            
            let growThreads = Math.ceil(ns.growthAnalyze(target, moneyMulti) / available_servers.length);
            let growTime = ns.getGrowTime(target);
            let newSecurityLevel = securityLevel + ns.growthAnalyzeSecurity(growThreads, target, 1);

            let hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, maxMoney) / available_servers.length);
            let hackTime = ns.getHackTime(target);
            newSecurityLevel += ns.hackAnalyzeSecurity(hackThreads, target);

            let baseWeakenAmount = ns.weakenAnalyze(1);
            let weakenTime = ns.getWeakenTime(target);
            let weakenThreads = Math.ceil(((newSecurityLevel - minSecurityLevel) / baseWeakenAmount) / available_servers.length);

            let totalDelay = growTime + hackTime + weakenTime;

            let growRamCost = Math.floor(ns.getScriptRam("/Hax/Grow.js", "home") * growThreads);
            let hackRamCost = Math.floor(ns.getScriptRam("/Hax/Hack.js", "home") * hackThreads);
            let weakenRamCost = Math.floor(ns.getScriptRam("/Hax/Weaken.js", "home") * weakenThreads);

            schedule.push("TotalDelay:" + totalDelay);
            schedule.push("GrowCost:" + growRamCost);
            schedule.push("/Hax/Grow.js:" + growThreads);
            schedule.push("HackCost:" + hackRamCost);
            schedule.push("HackDelay:" + growTime);
            schedule.push("/Hax/Hack.js:" + hackThreads);
            schedule.push("WeakenCost:" + weakenRamCost);
            schedule.push("WeakenDelay:" + growTime + hackTime);
            schedule.push("/Hax/Weaken.js:" + weakenThreads);
        }
        else
        {
            //Server is prepped at minSecurity and >= maxMoney
            let hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, maxMoney) / available_servers.length);
            let hackTime = ns.getHackTime(target);
            let newSecurityLevel = ns.hackAnalyzeSecurity(hackThreads, target);

            let baseWeakenAmount = ns.weakenAnalyze(1);
            let weakenTime = ns.getWeakenTime(target);
            let weakenThreads = Math.ceil(((newSecurityLevel - minSecurityLevel) / baseWeakenAmount) / available_servers.length);
            let totalDelay = hackTime + weakenTime;

            let hackRamCost = Math.floor(ns.getScriptRam("/Hax/Hack.js", "home") * hackThreads);
            let weakenRamCost = Math.floor(ns.getScriptRam("/Hax/Weaken.js", "home") * weakenThreads);

            schedule.push("TotalDelay:" + totalDelay);
            schedule.push("HackCost:" + hackRamCost);
            schedule.push("/Hax/Hack.js:" + hackThreads);
            schedule.push("WeakenCost:" + weakenRamCost);
            schedule.push("WeakenDelay:" + hackTime);
            schedule.push("/Hax/Weaken.js:" + weakenThreads);
        }
    }
    else
    {
        //Server needs to be weakened to minSecurity
        let baseWeakenAmount = ns.weakenAnalyze(1);
        let weakenTime = ns.getWeakenTime(target);
        let weakenThreads = Math.ceil(((securityLevel - minSecurityLevel) / baseWeakenAmount) / available_servers.length);
        let weakenRamCost = Math.floor(ns.getScriptRam("/Hax/Weaken.js", "home") * weakenThreads);

        schedule.push("TotalDelay:" + weakenTime);
        schedule.push("WeakenCost:" + weakenRamCost);
        schedule.push("/Hax/Weaken.js:" + weakenThreads);
    }

    return schedule;
}

async function SendBatch(ns, target, schedule)
{
    if (target &&
        schedule.length > 0)
    {
        let totalDelay = 0;
        let growCost = 0;
        let growThreads = 0;
        let hackCost = 0;
        let hackDelay = 0;
        let hackThreads = 0;
        let weakenCost = 0;
        let weakenDelay = 0;
        let weakenThreads = 0;
        
        for (let i = 0; i < schedule.length; i++)
        {
            let order = schedule[i];

            if (order.includes("TotalDelay"))
            {
                totalDelay = order.split(':')[1];
            }
            else if (order.includes("GrowCost"))
            {
                growCost = order.split(':')[1];
            }
            else if (order.includes("Grow.js"))
            {
                growThreads = order.split(':')[1];
            }
            else if (order.includes("HackCost"))
            {
                hackCost = order.split(':')[1];
            }
            else if (order.includes("HackDelay"))
            {
                hackDelay = order.split(':')[1];
            }
            else if (order.includes("Hack.js"))
            {
                hackThreads = order.split(':')[1];
            }
            else if (order.includes("WeakenCost"))
            {
                weakenCost = order.split(':')[1];
            }
            else if (order.includes("WeakenDelay"))
            {
                weakenDelay = order.split(':')[1];
            }
            else if (order.includes("Weaken.js"))
            {
                weakenThreads = order.split(':')[1];
            }
        }

        let batch = 
        {
            TotalDelay: totalDelay,
            Target: target,
            GrowCost: growCost,
            GrowThreads: growThreads,
            HackCost: hackCost,
            HackDelay: hackDelay,
            HackThreads: hackThreads,
            WeakenCost: weakenCost,
            WeakenDelay: weakenDelay,
            WeakenThreads: weakenThreads
        }
        let batchStr = JSON.stringify(batch);
        let ranBatch = false;

        let totalCost = Number(growCost) + Number(hackCost) + Number(weakenCost);
        if (totalCost > 0)
        {
            for (let a = 0; a < available_servers.length; a++)
            {
                let server = available_servers[a];

                let availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
                if (availableRam >= totalCost)
                {
                    ranBatch = true;
                    //ns.tprint("Total cost for " + server + ": " + totalCost);
                    await ns.exec("/Hax/RunBatch.js", server, 1, batchStr);
                    await ns.sleep(100);
                }
            }
        }
        
        return ranBatch;
    }

    return false;
}