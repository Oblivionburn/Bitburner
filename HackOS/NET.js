/*
    NET handles scanning the network,
		maintaining a map of the network,
		and returning requests for network data.
	RAM Cost: 2.80GB
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
		let packet = await CheckReceived(ns);
        if (packet != null)
        {
			if (packet.Request == "ROOT_SERVERS")
			{
				await RootServers(ns);
				await Scan_RootedServers(ns);
			}
            else if (packet.Request == "SCAN_DEEP")
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
				await Scan_PurchasedServers(ns);

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("PURCHASED_SERVERS", purchased_servers);

				await Send(ns, packet);
			}
			else if (packet.Request == "RETURN_AVAILABLE")
			{
				await Scan_AvailableServers(ns);

				packet.Destination = packet.Source;
				packet.Source = "NET";
				packet.Data = new Data("AVAILABLE_SERVERS", available_servers);

				await Send(ns, packet);
			}
        }

		ns.clearLog();
		await Log(ns);
		
		await ns.sleep(100);
    }
}

export async function GetBaseServers()
{
	return base_servers;
}

export async function GetPurchasedServers()
{
	return purchased_servers;
}

async function Log(ns)
{
	let purchasedServerNumLimit = ns.getPurchasedServerLimit();
	let minPurchasedServerRam = Number.MAX_SAFE_INTEGER;
	let maxPurchasedServerRam = 0;
	let nextCost = Number.MAX_SAFE_INTEGER;

	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		
		let maxRam = ns.getServerMaxRam(server);
		if (maxRam < minPurchasedServerRam)
		{
			minPurchasedServerRam = maxRam;
		}
		if (maxRam > maxPurchasedServerRam)
		{
			maxPurchasedServerRam = maxRam;
		}

		let serverCost = ns.getPurchasedServerCost(maxRam * 2);
		if (serverCost < nextCost)
		{
			nextCost = serverCost;
		}
	}

	if (minPurchasedServerRam == Number.MAX_SAFE_INTEGER)
	{
		minPurchasedServerRam = 0;
	}
	if (nextCost == Number.MAX_SAFE_INTEGER)
	{
		nextCost = ns.getPurchasedServerCost(2);
	}
	
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
	ns.print(`${colors["white"] + "Min Purchased Server Ram: " + colors["green"] + minPurchasedServerRam}`);
	ns.print(`${colors["white"] + "Max Purchased Server Ram: " + colors["green"] + maxPurchasedServerRam}`);
	ns.print(`${colors["white"] + "Next Purchased Server Cost: " + colors["green"] + "$" + nextCost.toLocaleString()}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Total Servers Available: " + colors["green"] + available_servers.length}`);
	ns.print("\n");
}

async function RootServers(ns)
{
	if (rooted_servers.length < base_servers.length)
	{
		for (let i = 0; i < base_servers.length; i++)
		{
			let server = base_servers[i];
			if (!rooted_servers.includes(server))
			{
				//Which port do we need to open?
				var portsRequired = ns.getServerNumPortsRequired(server);

				var canBruteSSH = ns.fileExists("BruteSSH.exe", "home");
				var canFTPCrack = ns.fileExists("FTPCrack.exe", "home");
				var canRelaySMTP = ns.fileExists("relaySMTP.exe", "home");
				var canHTTPWorm = ns.fileExists("HTTPWorm.exe", "home");
				var canSQLInject = ns.fileExists("SQLInject.exe", "home");

				//Do we already have root access for this server?
				var hasRoot = ns.hasRootAccess(server);
				if (!hasRoot)
				{
					var portsOpened = 0;
					if (portsRequired >= 5 &&
						canSQLInject)
					{
						portsOpened++;
						ns.sqlinject(server);
					}
					if (portsRequired >= 4 &&
						canHTTPWorm)
					{
						portsOpened++;
						ns.httpworm(server);
					}
					if (portsRequired >= 3 &&
						canRelaySMTP)
					{
						portsOpened++;
						ns.relaysmtp(server);
					}
					if (portsRequired >= 2 &&
						canFTPCrack)
					{
						portsOpened++;
						ns.ftpcrack(server);
					}
					if (portsRequired >= 1 &&
						canBruteSSH)
					{
						portsOpened++;
						ns.brutessh(server);
					}

					if (portsOpened >= portsRequired)
					{
						ns.nuke(server);

						//Send alert to Terminal
						ns.tprint("Gained root access to '" + server + "' server!");
					}
					
					hasRoot = ns.hasRootAccess(server);
				}

				if (hasRoot)
				{
					rooted_servers.push(server);
				}
			}
		}
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
	let count = rooted_servers.length;
	if (count > 0)
	{
		for (let i = 0; i < count; i++)
		{
			let server = rooted_servers[i];

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