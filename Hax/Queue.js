import * as IO from "/Hax/IO.js";

let hack_queue = [];
let grow_queue = [];
let weaken_queue = [];
let error_queue = [];

let queue_cap = 5000;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.clearLog();

	hack_queue = [];
	grow_queue = [];
	weaken_queue = [];
	error_queue = [];
	
	let hack_running = [];
	IO.Write(ns, "hack_running", hack_running);

	let grow_running = [];
	IO.Write(ns, "grow_running", grow_running);

	let weaken_running = [];
	IO.Write(ns, "weaken_running", weaken_running);

	while (true)
	{
		FetchPackets(ns);
		await ns.sleep(1);
	}
}

/** @param {NS} ns */
function FetchPackets(ns)
{
	for (let i = 1; i <= 4; i++)
	{
		let peek = ns.peek(i);
		if (peek != "NULL PORT DATA")
		{
			let data = ns.readPort(i);
			
			switch (i)
			{
				case 1:
					Hack_Read(ns, data);
					break;

				case 2:
					Grow_Read(ns, data);
					break;

				case 3:
					Weaken_Read(ns, data);
					break;

				case 4:
					Error_Read(ns, data);
					break;
			}
		}
	}
}

function Hack_Read(ns, data)
{
	if (hack_queue.length >= queue_cap)
	{
		hack_queue.splice(0, 1);
	}

	hack_queue.push(data);

	if (data.State == "Finished")
	{
		let hack_running = IO.Read(ns, "hack_running");
		Handle_Finished(ns, data, hack_running, "hack_running");
		hack_queue.pop();
	}
}

export function Hack_GetData(state, host, target)
{
	let count = hack_queue.length;
	for (let i = 0; i < count; i++)
	{
		let data = hack_queue[i];
		if (data.State == state &&
				data.Host == host &&
				data.Target == target)
		{
			hack_queue.splice(i, 1);
			return data;
		}
	}
	
	return null;
}

function Grow_Read(ns, data)
{
	if (grow_queue.length >= queue_cap)
	{
		grow_queue.splice(0, 1);
	}

	grow_queue.push(data);

	if (data.State == "Finished")
	{
		let grow_running = IO.Read(ns, "grow_running");
		Handle_Finished(ns, data, grow_running, "grow_running");
		grow_queue.pop();
	}
}

export function Grow_GetData(state, host, target)
{
	let count = grow_queue.length;
	for (let i = 0; i < count; i++)
	{
		let data = grow_queue[i];
		if (data.State == state &&
				data.Host == host &&
				data.Target == target)
		{
			grow_queue.splice(i, 1);
			return data;
		}
	}
	
	return null;
}

function Weaken_Read(ns, data)
{
	if (weaken_queue.length >= queue_cap)
	{
		weaken_queue.splice(0, 1);
	}

	weaken_queue.push(data);

	if (data.State == "Finished")
	{
		let weaken_running = IO.Read(ns, "weaken_running");
		Handle_Finished(ns, data, weaken_running, "weaken_running");
		weaken_queue.pop();
	}
}

export function Weaken_GetData(state, host, target)
{
	let count = weaken_queue.length;
	for (let i = 0; i < count; i++)
	{
		let data = weaken_queue[i];
		if (data.State == state &&
				data.Host == host &&
				data.Target == target)
		{
			weaken_queue.splice(i, 1);
			return data;
		}
	}
	
	return null;
}

function Handle_Finished(ns, data, array, name)
{
	if (array == null)
	{
		return;
	}

	let count = array.length;
	for (let i = 0; i < count; i++)
	{
		let packet = array[i];
		if (data.Host == packet.Host &&
				data.Target == packet.Target)
		{
			array.splice(i, 1);
			IO.Write(ns, name, array);
			break;
		}
	}
}

function Error_Read(ns, data)
{
	if (error_queue.length >= queue_cap)
	{
		error_queue.splice(0, 1);
	}

	error_queue.push(data);
}

export function Error_GetData(state, host, target)
{
	let count = error_queue.length;
	for (let i = 0; i < count; i++)
	{
		let data = error_queue[i];
		if (data.State == state &&
				data.Host == host &&
				data.Target == target)
		{
			error_queue.splice(i, 1);
			return data;
		}
	}
	
	return null;
}