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

        await CompileSchedules(ns);
        await RunSchedules(ns);
        await ns.sleep(1);
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

    let securityLevel = ns.getServerSecurityLevel(target);
    let minSecurityLevel = ns.getServerMinSecurityLevel(target);

    if (securityLevel <= minSecurityLevel)
    {
        let availableMoney = ns.getServerMoneyAvailable(target);
        let maxMoney = ns.getServerMaxMoney(target);
        let moneyThresh = maxMoney * 0.5;

        if (availableMoney < moneyThresh)
        {
            //Server is at minSecurity but needs to be grown to the
            //  moneyThresh before being hacked
            let moneyMulti = 0;
            if (availableMoney > 0)
            {
                moneyMulti = moneyThresh / availableMoney;
            }
            else
            {
                moneyMulti = moneyThresh;
            }
            
            let growThreads = ns.growthAnalyze(target, moneyMulti);
            let growTime = ns.getGrowTime(target);
            let newSecurityLevel = securityLevel + ns.growthAnalyzeSecurity(growThreads, target, 1);

            let hackThreads = Math.floor(ns.hackAnalyzeThreads(target, moneyThresh));
            let hackTime = ns.getHackTime(target);
            newSecurityLevel += ns.hackAnalyzeSecurity(hackThreads, target);

            let baseWeakenAmount = ns.weakenAnalyze(1);
            let weakenTime = ns.getWeakenTime(target);
            let weakenThreads = Math.ceil((newSecurityLevel - minSecurityLevel) / baseWeakenAmount);

            let totalDelay = growTime + hackTime + weakenTime;

            schedule.push("TotalDelay:" + totalDelay);
            schedule.push("/Hax/Grow.js:" + growThreads);
            schedule.push("HackDelay:" + growTime);
            schedule.push("/Hax/Hack.js:" + hackThreads);
            schedule.push("WeakenDelay:" + growTime + hackTime);
            schedule.push("/Hax/Weaken.js:" + weakenThreads);
        }
        else
        {
            //Server is prepped at minSecurity and >= moneyThresh
            let hackThreads = Math.floor(ns.hackAnalyzeThreads(target, moneyThresh));
            let hackTime = ns.getHackTime(target);
            let newSecurityLevel = ns.hackAnalyzeSecurity(hackThreads, target);

            let baseWeakenAmount = ns.weakenAnalyze(1);
            let weakenTime = ns.getWeakenTime(target);
            let weakenThreads = Math.ceil((newSecurityLevel - minSecurityLevel) / baseWeakenAmount);

            let totalDelay = hackTime + weakenTime;

            schedule.push("TotalDelay:" + totalDelay);
            schedule.push("/Hax/Hack.js:" + hackThreads);
            schedule.push("WeakenDelay:" + hackTime);
            schedule.push("/Hax/Weaken.js:" + weakenThreads);
        }
    }
    else
    {
        //Server needs to be weakened to minSecurity
        let baseWeakenAmount = ns.weakenAnalyze(1);
        let weakenTime = ns.getWeakenTime(target);
        let weakenThreads = Math.ceil((securityLevel - minSecurityLevel) / baseWeakenAmount);

        schedule.push("TotalDelay:" + weakenTime);
        schedule.push("/Hax/Weaken.js:" + weakenThreads);
    }

    return schedule;
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
        }
    }
}

async function SendBatch(ns, target, schedule)
{
    if (target &&
        schedule.length > 0)
    {
        let totalDelay = 0;
        let growThreads = 0;
        let hackDelay = 0;
        let hackThreads = 0;
        let weakenDelay = 0;
        let weakenThreads = 0;
        
        for (let i = 0; i < schedule.length; i++)
        {
            let order = schedule[i];

            if (order.includes("TotalDelay"))
            {
                totalDelay = order.split(':')[1];
            }
            else if (order.includes("Grow.js"))
            {
                growThreads = order.split(':')[1];
            }
            else if (order.includes("HackDelay"))
            {
                hackDelay = order.split(':')[1];
            }
            else if (order.includes("Hack.js"))
            {
                hackThreads = order.split(':')[1];
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

        let ranBatch = false;

        let batch = 
        {
            TotalDelay: totalDelay,
            Target: target,
            GrowThreads: growThreads,
            HackDelay: hackDelay,
            HackThreads: hackThreads,
            WeakenDelay: weakenDelay,
            WeakenThreads: weakenThreads
        }
        let batchStr = JSON.stringify(batch);

        for (let a = 0; a < available_servers.length; a++)
        {
            let server = available_servers[a];
            if (ns.exec("/Hax/RunBatch.js", server, 1, batchStr) > 0)
            {
                ranBatch = true;
            }
        }

        return ranBatch;
    }

    return false;
}