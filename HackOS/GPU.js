import {Bus} from "Bus.js";
import {Packet} from "Packet.js";

/** @param {NS} ns */
export async function main(ns)
{
    while (true)
    {
        let packet = Receive();
        if (packet != null)
        {
            //Do stuff
        }

        await ns.sleep(1000);
    }
}

async function Receive()
{
    let inputPort = ns.getPortHandle(Bus.portMap["GPU IN"]);
    if (!inputPort.empty())
    {
        let packet = JSON.parse(port.read());
        packet = Object.assign(Packet.prototype, packet);
        return packet;
    }

    return null;
}

async function Send(packetName, destination, data)
{
    let outputPort = ns.getPortHandle(Bus.portMap["GPU OUT"]);
    let packet = new Packet(packetName, "GPU", destination, data);
    let packetData = JSON.stringify(packet);
    
    return outputPort.tryWrite(packetData);
}