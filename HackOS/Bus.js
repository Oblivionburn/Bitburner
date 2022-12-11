/*
    Queues and routes packets being sent between hardware
    RAM Cost: 1.60GB
*/

import {Packet} from "./HackOS/Packet.js";

let queue = [];

export const portMap = 
{
    "Void":    0,
    "CPU IN":  1,
    "GPU IN":  2,
    "NET IN":  3,
    "RAM IN":  4,
    "CPU OUT": 5,
    "GPU OUT": 6,
    "NET OUT": 7,
    "RAM OUT": 8
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
    ns.tail(ns.getScriptName(), "home");
    ns.clearLog();

    while (true)
    {
        if (queue.length > 0)
        {
            await Push(ns);
        }
        else
        {
            await Pull(ns);
        }

        await ns.sleep(1);
    }
}

async function Pull(ns)
{
    let received = false;

    //Scan all the OUT ports for packets
    for (let i = 5; i <= 8; i++)
    {
        let port = ns.getPortHandle(i);
        if (!port.empty())
        {
            received = true;

            let packet = JSON.parse(port.read());
            packet = Object.assign(Packet.prototype, packet);
            queue.push(packet);
        }
    }

    return received;
}

async function Push(ns)
{
    if (queue.length > 0)
    {
        let object = queue.shift();
        let packet = Object.assign(Packet.prototype, object);

        let portNum = portMap[packet.Destination + " IN"];
        if (portNum != null)
        {
            let port = ns.getPortHandle(portNum);
            let data = JSON.stringify(packet);
            if (port.tryWrite(data))
            {
                ns.print(`${colors["white"] + "- Routing " + colors["green"] + "'" + packet.Request + "'" + colors["white"] + 
                    " Packet from " + colors["yellow"] + packet.Source + colors["white"] + " to " + colors["yellow"] + 
                    packet.Destination + colors["white"] + "."}`);
                return true;
            }
        }
    }

    return false;
}