/*
    Processes instructions sent from other hardware
	RAM Cost: 1.60GB
*/

import {portMap} from "./HackOS/Bus.js";
import {Packet} from "./HackOS/Packet.js";

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

    let newPacket = new Packet("SCAN_DEEP", "CPU", "NET", null);
    await Send(ns, newPacket);
    
    while (true)
    {
        ns.clearLog();
        ns.print("Waiting for instructions...");

        let packet = CheckReceived(ns);
        if (packet != null)
        {
            //Do stuff
			
			await ns.sleep(200);
        }
		else
		{
			await ns.sleep(1);
		}
    }
}

async function CheckReceived(ns)
{
    let portNum = portMap["CPU IN"];
    if (portNum != null)
    {
        ns.print("Listening for incoming packets on port " + portNum + "...");

        let inputPort = ns.getPortHandle(portNum);
        if (!inputPort.empty())
        {
            let object = JSON.parse(port.read());
            let packet = Object.assign(Packet.prototype, object);
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
            ns.print("Sent '" + packet.Name + "' Packet to: " + packet.Destination);
            return true;
        }
    }
    
    return false;
}