import * as HDD from "./OS/HDD.js";
import * as Util from "./OS/Apps/Util.js";

let messages = [];
let message_cache = [];
let weaken_queue = [];
let grow_queue = [];
let hack_queue = [];
let batch_queue = [];
let nic_queue = [];

let queue_cap = 5000;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.clearLog();

	messages = [];
	message_cache = [];

	weaken_queue = [];
	grow_queue = [];
	hack_queue = [];
	batch_queue = [];
	nic_queue = [];

	let batches_running = [];
	HDD.Write(ns, "batches_running", batches_running);

	let grow_running = [];
	HDD.Write(ns, "grow_running", grow_running);

	let weaken_running = [];
	HDD.Write(ns, "weaken_running", weaken_running);

	let hack_running = [];
	HDD.Write(ns, "hack_running", hack_running);
	
	while (true)
	{
		GetMessages(ns);

		if (messages.length > 0)
		{
			QueueMessages(ns);
		}
		
		await ns.sleep(1);
	}
}

/** @param {NS} ns */
function GetMessages(ns)
{
	for (let i = 1; i <= 20; i++)
	{
		let peek = ns.peek(i);
		if (peek != "NULL PORT DATA")
		{
			let data = ns.readPort(i);
			messages.push(data);

			if (message_cache.length >= queue_cap)
			{
				message_cache.splice(0, 1);
			}
			message_cache.push(data);

			ns.print(`Message from Port ${i}: {DateTime:${data.DateTime}, Host:${data.Host}, Order:${data.Order}, Target:${data.Target}, State:${data.State}}\n`);
		}
	}
}

/** @param {NS} ns */
function QueueMessages(ns)
{
	for (let i = 0; i < messages.length; i++)
	{
		let message = messages[i];

		switch (message.Order)
		{
			case "Weaken":
				if (weaken_queue.length >= queue_cap)
				{
					weaken_queue.splice(0, 1);
				}

				weaken_queue.push(message);
				messages.splice(i, 1);
				i--;

				if (message.State == "Finished")
				{
					Handle_WeakenFinished(ns, message);
				}

				break;

			case "Grow":
				if (grow_queue.length >= queue_cap)
				{
					grow_queue.splice(0, 1);
				}

				grow_queue.push(message);
				messages.splice(i, 1);
				i--;

				if (message.State == "Finished")
				{
					Handle_GrowFinished(ns, message);
				}

				break;

			case "Hack":
				if (hack_queue.length >= queue_cap)
				{
					hack_queue.splice(0, 1);
				}

				hack_queue.push(message);
				messages.splice(i, 1);
				i--;

				if (message.State == "Finished")
				{
					Handle_HackFinished(ns, message);
				}

				break;

			case "RunBatch":
			case "/OS/Apps/Weaken.js":
			case "/OS/Apps/Grow.js":
			case "/OS/Apps/Hack.js":
				if (batch_queue.length >= queue_cap)
				{
					batch_queue.splice(0, 1);
				}

				batch_queue.push(message);
				messages.splice(i, 1);
				i--;
				break;

			case "Purchase":
			case "Upgrade":
			case "Root":
				if (nic_queue.length >= queue_cap)
				{
					nic_queue.splice(0, 1);
				}

				nic_queue.push(message);
				messages.splice(i, 1);
				i--;
				break;
		}
	}
}

export function GetMessage_Cache()
{
	let queue = [];

	let count = message_cache.length;
	for (let i = 0; i < count; i++)
	{
		let message = message_cache[i];
		queue.push(message);
	}

	return queue;
}

export function GetMessage_Weaken(state, host, target)
{
	let count = weaken_queue.length;
	for (let i = 0; i < count; i++)
	{
		let message = weaken_queue[i];
		if (message.State == state &&
				message.Host == host &&
				message.Target == target)
		{
			weaken_queue.splice(i, 1);
			return message;
		}
	}
	
	return null;
}

function Handle_WeakenFinished(ns, message)
{
	let weaken_running = HDD.Read(ns, "weaken_running");
	let count = Util.GetLength(weaken_running);
	if (count)
	{
		for (let i = 0; i < count; i++)
		{
			let weaken = weaken_running[i];
			if (message.Host == weaken.Host &&
					message.Target == weaken.Target)
			{
				weaken_running.splice(i, 1);
				HDD.Write(ns, "weaken_running", weaken_running);
				break;
			}
		}
	}
}

export function GetMessage_Grow(state, host, target)
{
	let count = grow_queue.length;
	for (let i = 0; i < count; i++)
	{
		let message = grow_queue[i];
		if (message.State == state &&
				message.Host == host &&
				message.Target == target)
		{
			grow_queue.splice(i, 1);
			return message;
		}
	}
	
	return null;
}

function Handle_GrowFinished(ns, message)
{
	let grow_running = HDD.Read(ns, "grow_running");
	let count = Util.GetLength(grow_running);
	if (count)
	{
		for (let i = 0; i < count; i++)
		{
			let grow = grow_running[i];
			if (message.Host == grow.Host &&
					message.Target == grow.Target)
			{
				grow_running.splice(i, 1);
				HDD.Write(ns, "grow_running", grow_running);
				break;
			}
		}
	}
}

export function GetMessage_Hack(state, host, target)
{
	let count = hack_queue.length;
	for (let i = 0; i < count; i++)
	{
		let message = hack_queue[i];
		if (message.State == state &&
				message.Host == host &&
				message.Target == target)
		{
			hack_queue.splice(i, 1);
			return message;
		}
	}
	
	return null;
}

function Handle_HackFinished(ns, message)
{
	let hack_running = HDD.Read(ns, "hack_running");
	let count = Util.GetLength(hack_running);
	if (count)
	{
		for (let i = 0; i < count; i++)
		{
			let hack = hack_running[i];
			if (message.Host == hack.Host &&
					message.Target == hack.Target)
			{
				hack_running.splice(i, 1);
				HDD.Write(ns, "hack_running", hack_running);
				break;
			}
		}
	}
}

export function GetMessage_Batch(state, host, target)
{
	let count = batch_queue.length;
	for (let i = 0; i < count; i++)
	{
		let message = batch_queue[i];
		if (message.State == state &&
				message.Host == host &&
				message.Target == target)
		{
			batch_queue.splice(i, 1);
			return message;
		}
	}
	
	return null;
}

function Handle_BatchFinished(ns, message)
{
	let batches_running = HDD.Read(ns, "batches_running");
	let count = Util.GetLength(batches_running);
	if (count)
	{
		for (let i = 0; i < count; i++)
		{
			let batch = batches_running[i];
			if (message.Host == batch.Host &&
					message.Target == batch.Target)
			{
				batches_running.splice(i, 1);
				HDD.Write(ns, "batches_running", batches_running);
				break;
			}
		}
	}
}

export function GetMessage_NIC(state)
{
	if (nic_queue.length > 0)
	{
		for (let i = 0; i < nic_queue.length; i++)
		{
			let message = nic_queue[i];
			if (message.State == state)
			{
				nic_queue.splice(i, 1);
				return message;
			}
		}
	}
	
	return null;
}