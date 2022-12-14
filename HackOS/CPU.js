/*
    CPU processes instructions sent from other hardware
	RAM Cost: 5.90GB
*/

import * as Bus from "./HackOS/Bus.js";
import {colors} from "./HackOS/UI.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

let available_servers = [];
let requestedAvailableServers = false;

let rooted_servers_with_money = [];
let requestedMoneyServers = false;

let inPort = "CPU IN";
let outPort = "CPU OUT";

let weaken_percent = 5;
let grow_percent = 75;
let hack_percent = 100 - weaken_percent - grow_percent;

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    await Init(ns);
    
    while (true)
    {
        if (!requestedAvailableServers)
		{
			requestedAvailableServers = await Bus.Send(ns, new Packet("RETURN", "CPU", "RAM", new Data("AVAILABLE_SERVERS", null)), outPort);
		}
        if (!requestedMoneyServers)
        {
            requestedMoneyServers = await Bus.Send(ns, new Packet("RETURN", "CPU", "RAM", new Data("ROOTED_SERVERS_WITH_MONEY", null)), outPort);
        }

        let packet = await Bus.CheckReceived(ns, inPort);
        if (packet != null)
        {
            if (packet.Request == "RETURN")
            {
                if (packet.Data.Name == "AVAILABLE_SERVERS")
                {
                    available_servers = packet.Data.List;
                    available_servers.sort((a,b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
                    requestedAvailableServers = false;
                }
                else if (packet.Data.Name == "ROOTED_SERVERS_WITH_MONEY")
                {
                    rooted_servers_with_money = packet.Data.List;
                    requestedMoneyServers = false;
                }
            }
            else if (packet.Request == "RETURN_FAILED")
            {
                if (packet.Data.Name == "AVAILABLE_SERVERS")
                {
                    await Bus.Send(ns, new Packet("SCAN_AVAILABLE", "CPU", "NET", null), outPort);
                    requestedAvailableServers = false;
                }
                else if (packet.Data.Name == "ROOTED_SERVERS_WITH_MONEY")
                {
                    await Bus.Send(ns, new Packet("SCAN_ROOTED", "CPU", "NET", null), outPort);
                    requestedMoneyServers = false;
                }
            }
        }

        ns.clearLog();
        await ManageHacking(ns);

		await ns.sleep(30000);
    }
}

async function Init(ns)
{
    await Bus.Send(ns, new Packet("SCAN_DEEP", "CPU", "NET", null), outPort);
    await Bus.Send(ns, new Packet("SCAN_AVAILABLE", "CPU", "NET", null), outPort);
}

async function ManageHacking(ns)
{
    let availableCount = available_servers.length;
    let weaken_index = Math.floor((availableCount * weaken_percent) / 100);
    let grow_index = Math.floor(weaken_index + (availableCount* grow_percent) / 100);

    let total_weaken_ram = 0;
    let total_grow_ram = 0;
    let total_hack_ram = 0;

    for (let i = 0; i < availableCount; i++)
    {
        let server = available_servers[i];
        
        let maxRam = ns.getServerMaxRam(server);
        let usedRam = ns.getServerUsedRam(server);
        let availableRam = maxRam - usedRam;

        if (i <= weaken_index)
        {
            total_weaken_ram += ns.getServerMaxRam(server);

            await RemoveScript(ns, "/HackOS/Grow.js", server);
            await RemoveScript(ns, "/HackOS/Hack.js", server);

            let scriptRamCost = ns.getScriptRam("/HackOS/Weaken.js", server);
            if (availableRam >= scriptRamCost)
            {
                if (ns.fileExists("/HackOS/Weaken.js", server))
                {
                    await RunScript(ns, "/HackOS/Weaken.js", server, maxRam, availableRam, scriptRamCost);
                }
                else
                {
                    ns.scp("/HackOS/Weaken.js", server, "home");
                }
            }
        }
        else if (i <= grow_index)
        {
            total_grow_ram += ns.getServerMaxRam(server);

            await RemoveScript(ns, "/HackOS/Weaken.js", server);
            await RemoveScript(ns, "/HackOS/Hack.js", server);

            let scriptRamCost = ns.getScriptRam("/HackOS/Grow.js", server);
            if (availableRam >= scriptRamCost)
            {
                if (ns.fileExists("/HackOS/Grow.js", server))
                {
                    await RunScript(ns, "/HackOS/Grow.js", server, maxRam, availableRam, scriptRamCost);
                }
                else
                {
                    ns.scp("/HackOS/Grow.js", server, "home");
                }
            }
        }
        else
        {
            total_hack_ram += ns.getServerMaxRam(server);

            await RemoveScript(ns, "/HackOS/Weaken.js", server);
            await RemoveScript(ns, "/HackOS/Grow.js", server);
            
            let scriptRamCost = ns.getScriptRam("/HackOS/Hack.js", server);
            if (availableRam >= scriptRamCost)
            {
                if (ns.fileExists("/HackOS/Hack.js", server))
                {
                    await RunScript(ns, "/HackOS/Hack.js", server, maxRam, availableRam, scriptRamCost);
                }
                else
                {
                    ns.scp("/HackOS/Hack.js", server, "home");
                }
            }
        }
    }

    ns.print(`${colors["white"] + "Rooted Servers With Money: " + colors["green"] + rooted_servers_with_money.length}`);
    ns.print(`${colors["white"] + "Available Servers: " + colors["green"] + available_servers.length}`);
    ns.print(`${colors["white"] + "Weaken Index: " + colors["green"] + "0 - " + weaken_index + " (" + weaken_percent + "%); " + total_weaken_ram + " GB"}`);
    ns.print(`${colors["white"] + "Grow Index: " + colors["green"] + (weaken_index + 1) + " - " + grow_index + " (" + grow_percent + "%); " + total_grow_ram + " GB"}`);
    ns.print(`${colors["white"] + "Hack Index: " + colors["green"] + (grow_index + 1) + " - " + (availableCount - 1) + " (" + hack_percent + "%); " + total_hack_ram + " GB"}`);
}

async function RemoveScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}

async function RunScript(ns, script, server, maxRam, availableRam, scriptRamCost)
{
	let serverCount = rooted_servers_with_money.length;
    if (serverCount > 0)
    {
        let allServersCost = scriptRamCost * serverCount;
        let threadsForAllServers = Math.floor(maxRam / allServersCost);
        let allServersRamCost = threadsForAllServers * scriptRamCost;

        for (let i = 0; i < serverCount; i++)
        {
            let server_with_money = rooted_servers_with_money[i];

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