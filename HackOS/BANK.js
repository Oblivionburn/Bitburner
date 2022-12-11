/*
    BANK handles transactions involving money
	RAM Cost: 7.50GB
*/

import {portMap,colors} from "./HackOS/Bus.js";
import {Packet} from "./HackOS/Packet.js";
import {Data} from "./HackOS/Data.js";

let purchased_servers = [];
let requestedServers = false;
var serverNumLimit = 0;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.clearLog();

	serverNumLimit = ns.getPurchasedServerLimit();

    while (true)
    {
		if (!requestedServers &&
			purchased_servers.length < serverNumLimit)
		{
			requestedServers = await Send(ns, new Packet("RETURN_PURCHASED_SERVERS", "BANK", "NET", null));
		}

        let packet = await CheckReceived(ns);
        if (packet != null)
        {
            if (packet.Request == "BUY_SERVER")
            {
                await BuyServer(ns);
            }
			else if (packet.Request == "UPGRADE_SERVERS")
            {
                await UpgradeServers(ns);
            }
            else if (packet.Request == "RETURN_PURCHASED_SERVERS")
            {
                purchased_servers = packet.Data.Data;
				requestedServers = false;
            }
        }

		await ns.sleep(100);
    }
}

async function BuyServer(ns)
{
	var money = ns.getPlayer().money;
	
	var serverCost = ns.getPurchasedServerCost(2);
	if (money >= serverCost &&
		purchased_servers.length < serverNumLimit)
	{
		ns.purchaseServer("PS-" + purchased_servers.length, 2);
	}
}

async function UpgradeServers(ns)
{
	var serverRamLimit = ns.getPurchasedServerMaxRam();
	
	for (let i = 0; i < purchased_servers.length; i++)
	{
		var money = ns.getPlayer().money;
		var server_name = purchased_servers[i];
		var serverRam = ns.getServerMaxRam(server_name);
		var nextRam = serverRam * 2;

		if (serverRam < serverRamLimit &&
			nextRam < serverRamLimit)
		{
			var upgradeCost = ns.getPurchasedServerCost(nextRam);
			if (money >= upgradeCost)
			{
				ns.killall(server_name);
				ns.deleteServer(server_name);
				ns.purchaseServer(server_name, nextRam);
			}
		}
	}
}

async function CheckReceived(ns)
{
    let portNum = portMap["BANK IN"];
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
    let portNum = portMap["BANK OUT"];
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