/*
    Queues and routes packets being sent between hardware
    RAM Cost: 1.60GB
*/

import {Packet} from "./HackOS/Packet.js";

export const portMap = 
{
    "Void":     0,
    "CPU IN":   1,
    "GPU IN":   2,
    "NET IN":   3,
    "RAM IN":   4,
    "BANK IN":  5,
    "CPU OUT":  6,
    "GPU OUT":  7,
    "NET OUT":  8,
    "RAM OUT":  9,
    "BANK OUT": 10,
    "UI OUT":   11,
};

export const colors = 
{
    red: "\u001b[31;1m",
    green: "\u001b[32;1m",
    yellow: "\u001b[33;1m",
    white: "\u001b[37;1m",
    reset: "\u001b[0m"
};

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");

    while (true)
    {
        ns.clearLog();

        for (let i = 6; i <= 11; i++)
        {
            let outPort = ns.getPortHandle(i);
            while (!outPort.empty())
            {
                let objectString = outPort.read();
                let object = JSON.parse(objectString);
                let packet = Object.assign(Packet.prototype, object);

                let portNum = portMap[packet.Destination + " IN"];
                if (portNum != null)
                {
                    let inPort = ns.getPortHandle(portNum);
                    if (inPort.tryWrite(objectString))
                    {
                        ns.print(`${colors["white"] + "- Routing " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                            " Packet from " + colors["yellow"] + packet.Source + colors["white"] + " to " + colors["yellow"] + 
                            packet.Destination + colors["white"] + "."}`);
                    }
                }
            }
        }

        await ns.sleep(100);
    }
}