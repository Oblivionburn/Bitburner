/*
    Holds data in memory for other hardware to request
*/

import {Bus} from "Bus.js";
import {Packet} from "Packet.js";
import {Data} from "Data.js";

export var memory = [];

/** @param {NS} ns */
export async function main(ns)
{
    while (true)
    {
        let packet = Receive(ns);
        if (packet != null)
        {
            if (packet.request == "SAVE")
            {
                let dataObject = Object.assign(Data.prototype, JSON.parse(packet.data));
                memory.push(dataObject);
            }
        }

        await ns.sleep(1000);
    }
}

async function Receive(ns)
{
    let inputPort = ns.getPortHandle(Bus.portMap["RAM IN"]);
    if (!inputPort.empty())
    {
        let packet = JSON.parse(port.read());
        packet = Object.assign(Packet.prototype, packet);
        return packet;
    }

    return null;
}

async function Send(ns, packetName, destination, data)
{
    let outputPort = ns.getPortHandle(Bus.portMap["RAM OUT"]);
    let packet = new Packet(packetName, "RAM", destination, data);
    let packetData = JSON.stringify(packet);
    
    return outputPort.tryWrite(packetData);
}