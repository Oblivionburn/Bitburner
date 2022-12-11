/*
    CPU processes instructions sent from other hardware
	RAM Cost: 5.80GB
*/

import {portMap,colors} from "./HackOS/Bus.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

let available_servers = [];
let requestedAvailableServers = false;

let rooted_servers_with_money = [];
let requestedMoneyServers = false;

let weaken_percent = 50;
let grow_percent = 40;
let hack_percent = 100 - weaken_percent - grow_percent;

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    await Init(ns);
    
    while (true)
    {
        await Send(ns, new Packet("ROOT_SERVERS", "CPU", "NET", null));
        await Send(ns, new Packet("BUY_SERVER", "CPU", "BANK", null));
        await Send(ns, new Packet("UPGRADE_SERVERS", "CPU", "BANK", null));

        if (!requestedAvailableServers)
		{
			requestedAvailableServers = await Send(ns, new Packet("RETURN_AVAILABLE", "CPU", "NET", null));
		}
        if (!requestedMoneyServers)
        {
            requestedMoneyServers = await Send(ns, new Packet("RETURN_ROOTED_WITH_MONEY", "CPU", "NET", null));
        }

        let packet = await CheckReceived(ns);
        if (packet != null)
        {
            if (packet.Request == "RETURN_BASE" ||
                packet.Request == "RETURN_BASE_WITH_MONEY" ||
                packet.Request == "RETURN_BASE_WITH_RAM")
            {
                await Send(ns, new Packet("STORE", "CPU", "RAM", packet.Data));
            }
            else if (packet.Request == "RETURN_AVAILABLE")
            {
                available_servers = packet.Data.List;
				requestedAvailableServers = false;
            }
            else if (packet.Request == "RETURN_ROOTED_WITH_MONEY")
            {
                rooted_servers_with_money = packet.Data.List;
				requestedMoneyServers = false;
            }
        }

        ns.clearLog();
        await ManageHacking(ns);

		await ns.sleep(1000);
    }
}

async function Init(ns)
{
    await Send(ns, new Packet("SCAN_DEEP", "CPU", "NET", null));
    await Send(ns, new Packet("SCAN_PURCHASED", "CPU", "NET", null));
    await Send(ns, new Packet("RETURN_BASE", "CPU", "NET", null));
    await Send(ns, new Packet("RETURN_BASE_WITH_MONEY", "CPU", "NET", null));
    await Send(ns, new Packet("RETURN_BASE_WITH_RAM", "CPU", "NET", null));
}

async function ManageHacking(ns)
{
    let availableCount = available_servers.length;
    let weaken_index = Math.floor((availableCount * weaken_percent) / 100);
    let grow_index = Math.floor(weaken_index + (availableCount* grow_percent) / 100);

    ns.print(`${colors["white"] + "Rooted Servers With Money: " + colors["green"] + rooted_servers_with_money.length}`);
    ns.print(`${colors["white"] + "Available Servers: " + colors["green"] + available_servers.length}`);
    ns.print(`${colors["white"] + "Weaken Index: " + colors["green"] + "0 - " + weaken_index + " (" + weaken_percent + "%)"}`);
    ns.print(`${colors["white"] + "Grow Index: " + colors["green"] + (weaken_index + 1) + " - " + grow_index + " (" + grow_percent + "%)"}`);
    ns.print(`${colors["white"] + "Hack Index: " + colors["green"] + (grow_index + 1) + " - " + (availableCount - 1) + " (" + hack_percent + "%)"}`);

    for (let i = 0; i < availableCount; i++)
    {
        let server = available_servers[i];
        
        if (i <= weaken_index)
        {
            await RemoveScript(ns, "/HackOS/Grow.js", server);
            await RemoveScript(ns, "/HackOS/Hack.js", server);

            if (ns.fileExists("/HackOS/Weaken.js", server))
            {
                await RunScript(ns, "/HackOS/Weaken.js", server);
            }
            else
            {
                ns.scp("/HackOS/Weaken.js", server, "home");
            }
        }
        else if (i <= grow_index)
        {
            await RemoveScript(ns, "/HackOS/Weaken.js", server);
            await RemoveScript(ns, "/HackOS/Hack.js", server);

            if (ns.fileExists("/HackOS/Grow.js", server))
            {
                await RunScript(ns, "/HackOS/Grow.js", server);
            }
            else
            {
                ns.scp("/HackOS/Grow.js", server, "home");
            }
        }
        else
        {
            await RemoveScript(ns, "/HackOS/Weaken.js", server);
            await RemoveScript(ns, "/HackOS/Grow.js", server);

            if (ns.fileExists("/HackOS/Hack.js", server))
            {
                await RunScript(ns, "/HackOS/Hack.js", server);
            }
            else
            {
                ns.scp("/HackOS/Hack.js", server, "home");
            }
        }
    }
}

async function RemoveScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}

async function RunScript(ns, script, server)
{
	let ramCost = ns.getScriptRam(script, server);
	let maxRam = ns.getServerMaxRam(server);
	let serverCount = rooted_servers_with_money.length;

    if (serverCount > 0)
    {
        let allServers = ramCost * serverCount;
        let threadsForAllServers = Math.floor(maxRam / allServers);
        let allServersRamCost = threadsForAllServers * ramCost;

        for (let i = 0; i < serverCount; i++)
        {
            let server_with_money = rooted_servers_with_money[i];
            let usedRam = ns.getServerUsedRam(server);
            let availableRam = maxRam - usedRam;

            if (availableRam >= allServersRamCost &&
                threadsForAllServers > 0)
            {
                ns.exec(script, server, threadsForAllServers, server_with_money);
            }
            else if (availableRam >= ramCost)
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

async function CheckReceived(ns)
{
    let portNum = portMap["CPU IN"];
    if (portNum != null)
    {
        let port = ns.getPortHandle(portNum);
        if (!port.empty())
        {
			let objectString = port.read();
            let object = JSON.parse(objectString);
            let packet = Object.assign(Packet.prototype, object);

            ns.print(`${colors["white"] + "- Received " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                " Packet from " + colors["yellow"] + packet.Source + colors["white"] + "."}`);

            return packet;
        }
    }

	return null;
}

async function Send(ns, packet)
{
    let portNum = portMap["CPU OUT"];
    if (portNum != null)
    {
        let outputPort = ns.getPortHandle(portNum);
        let packetData = JSON.stringify(packet);

		if (outputPort.tryWrite(packetData))
        {
            ns.print(`${colors["white"] + "- Sent " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                " Packet to " + colors["yellow"] + packet.Destination + colors["white"] + "."}`);
            return true;
        }
		else
		{
            ns.print(`${colors["red"] + "- Failed to Send " + colors["green"] + "'" + packet.Request + "'" + colors["red"] + 
                " Packet to " + colors["yellow"] + packet.Destination + colors["red"] + "."}`);
		}
    }
    
    return false;
}