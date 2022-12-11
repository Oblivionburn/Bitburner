/*
    This hardware is able to scan the network,
		maintain a map of the network,
		and return requests for mapped data.
	RAM Cost: 2.05GB
*/

import {portMap,colors} from "./HackOS/Bus.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

let base_servers = [];
let base_servers_with_money = [];
let base_servers_with_ram = [];
let rooted_servers = [];
let rooted_servers_with_money = [];
let rooted_servers_with_ram = [];
let purchased_servers = [];
let available_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    while (true)
    {
        ns.clearLog();

		let purchasedServerNumLimit = ns.getPurchasedServerLimit();
		
		ns.print(`${colors["white"] + "Base Servers: " + colors["green"] + base_servers.length}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Base Servers with money: " + colors["green"] + base_servers_with_money.length}`);
		ns.print(`${colors["white"] + "Rooted Base Servers with money: " + colors["green"] + rooted_servers_with_money.length}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Base Servers with ram: " + colors["green"] + base_servers_with_ram.length}`);
		ns.print(`${colors["white"] + "Rooted Base Servers with ram: " + colors["green"] + rooted_servers_with_ram.length}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Max Purchased Servers: " + colors["green"] + purchasedServerNumLimit}`);
		ns.print(`${colors["white"] + "Purchased Servers: " + colors["green"] + purchased_servers.length}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Total Servers Available: " + colors["green"] + available_servers.length}`);
		ns.print("\n");

		let packet = await CheckReceived(ns);
        if (packet != null)
        {
            if (packet.Request == "SCAN_DEEP")
            {
                await DeepScan(ns, "home");
            }
			else if (packet.Request == "SCAN_ROOTED")
            {
                await Scan_RootedServers(ns);
            }
			else if (packet.Request == "SCAN_PURCHASED")
            {
                await Scan_PurchasedServers(ns);
            }
			else if (packet.Request == "SCAN_AVAILABLE")
			{
				await Scan_AvailableServers(ns);
			}
			else if (packet.Request == "RETURN_BASE")
			{
				if (base_servers.length == 0)
				{
					await DeepScan(ns, "home");
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("BASE_SERVERS", base_servers);
				
				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_BASE_WITH_MONEY")
			{
				if (base_servers_with_money.length == 0)
				{
					await DeepScan(ns, "home");
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("BASE_SERVERS_WITH_MONEY", base_servers_with_money);

				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_BASE_WITH_RAM")
			{
				if (base_servers_with_ram.length == 0)
				{
					await DeepScan(ns, "home");
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("BASE_SERVERS_WITH_RAM", base_servers_with_ram);

				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_ROOTED")
			{
				if (rooted_servers.length == 0)
				{
					await Scan_RootedServers(ns);
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("ROOTED_SERVERS", rooted_servers);

				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_ROOTED_WITH_MONEY")
			{
				if (rooted_servers_with_money.length == 0)
				{
					await Scan_RootedServers(ns);
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("ROOTED_SERVERS_WITH_MONEY", rooted_servers_with_money);

				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_ROOTED_WITH_RAM")
			{
				if (rooted_servers_with_ram.length == 0)
				{
					await Scan_RootedServers(ns);
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("ROOTED_SERVERS_WITH_RAM", rooted_servers_with_ram);

				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_PURCHASED")
			{
				if (purchased_servers.length == 0)
				{
					await Scan_PurchasedServers(ns);
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("PURCHASED_SERVERS", purchased_servers);

				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_AVAILABLE")
			{
				if (available_servers.length == 0)
				{
					await Scan_AvailableServers(ns);
				}

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("AVAILABLE_SERVERS", available_servers);

				await Send(ns, newPacket);
			}
        }

		await ns.sleep(100);
    }
}

async function DeepScan(ns, server)
{
	let scan_results = ns.scan(server);
	if (scan_results.length > 0)
	{
		for (let i = 0; i < scan_results.length; i++)
		{
			let server = scan_results[i];

			if (server != "home" &&
				!server.includes("PS-") &&
				!base_servers.includes(server))
			{
				let maxMoney = ns.getServerMaxMoney(server);
				if (maxMoney > 0 &&
					!base_servers_with_money.includes(server))
				{
					base_servers_with_money.push(server);
				}

				let maxRam = ns.getServerMaxRam(server);
				if (maxRam > 0 &&
					!base_servers_with_ram.includes(server))
				{
					base_servers_with_ram.push(server);
				}

				base_servers.push(server);
				await DeepScan(ns, server);
			}
		}
	}
}

async function Scan_RootedServers(ns)
{
	if (base_servers.length == 0)
	{
		await DeepScan(ns, "home");
	}

	let baseCount = base_servers.length;
	if (baseCount > 0)
	{
		for (let i = 0; i < baseCount; i++)
		{
			let server = base_servers[i];

			if (ns.hasRootAccess(server) &&
				!rooted_servers.includes(server))
			{
				rooted_servers.push(server);

				if (base_servers_with_money.includes(server) &&
					!rooted_servers_with_money.includes(server))
				{
					rooted_servers_with_money.push(server);
				}

				if (base_servers_with_ram.includes(server) &&
					!rooted_servers_with_ram.includes(server))
				{
					rooted_servers_with_ram.push(server);
				}
			}
		}
	}
}

async function Scan_PurchasedServers(ns)
{
	let scan_results = ns.scan("home");
	let scanCount = scan_results.length;
	if (scanCount > 0)
	{
		for (let i = 0; i < scanCount; i++)
		{
			let server = scan_results[i];

			if (server.includes("PS-") &&
				!purchased_servers.includes(server))
			{
				purchased_servers.push(server);
			}
		}
	}
}

async function Scan_AvailableServers(ns)
{
	if (rooted_servers_with_ram.length == 0)
	{
		await Scan_RootedServers(ns);
	}

	if (purchased_servers.length == 0)
	{
		await Scan_PurchasedServers(ns);
	}

	var total = rooted_servers_with_ram.length + purchased_servers.length;
	if (available_servers.length < total)
	{
		for (let i = 0; i < rooted_servers_with_ram.length; i++)
		{
			let server = rooted_servers_with_ram[i];
			if (!available_servers.includes(server))
			{
				available_servers.push(server);
			}
		}

		for (let i = 0; i < purchased_servers.length; i++)
		{
			let server = purchased_servers[i];
			if (!available_servers.includes(server))
			{
				available_servers.push(server);
			}
		}
	}
}

async function CheckReceived(ns)
{
    let portNum = portMap["NET IN"];
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
    let portNum = portMap["NET OUT"];
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