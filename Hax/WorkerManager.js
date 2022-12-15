import * as Database from "./Hax/DatabaseManager.js";

let available_servers = [];
let rooted_with_money = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
    //ns.tail(ns.getScriptName(), "home");
    
    while (true)
    {
        available_servers = await Database.Select(ns, "available_servers");
        rooted_with_money = await Database.Select(ns, "rooted_with_money");

        ns.clearLog();
        await DistributeWorkers(ns);
        await ns.sleep(1000);
    }
}

async function DistributeWorkers(ns)
{
    if (available_servers != null)
    {
        for (let i = 0; i < available_servers.length; i++)
        {
            let server = available_servers[i];

            if (ns.fileExists("/Hax/Worker.js", server))
            {
                await RunScript(ns, "/Hax/Worker.js", server);
            }
            else
            {
                ns.scp("/Hax/Worker.js", server, "home");
            }
        }
    }
}

async function RunScript(ns, script, server)
{
    if (rooted_with_money != null)
    {
        let serverCount = rooted_with_money.length;
        if (serverCount > 0)
        {
            let maxRam = ns.getServerMaxRam(server);
            let usedRam = ns.getServerUsedRam(server);
            let availableRam = maxRam - usedRam;

            let scriptRamCost = ns.getScriptRam(script, server);
            let allServersCost = scriptRamCost * serverCount;
            let threadsForAllServers = Math.floor(maxRam / allServersCost);
            let allServersRamCost = threadsForAllServers * scriptRamCost;

            for (let i = 0; i < serverCount; i++)
            {
                let server_with_money = rooted_with_money[i];

                if (availableRam >= allServersRamCost &&
                    threadsForAllServers > 0 &&
                    !ns.isRunning(script, server, threadsForAllServers, server_with_money))
                {
                    ns.exec(script, server, threadsForAllServers, server_with_money);
                }
                else if (availableRam >= scriptRamCost &&
                        !ns.isRunning(script, server, 1, server_with_money))
                {
                    ns.exec(script, server, 1, server_with_money);
                }
                else
                {
                    break;
                }
            }
        }
    }
}