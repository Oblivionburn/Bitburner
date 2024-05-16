let messages = [];
let message_cache = [];
let weaken_queue = [];
let grow_queue = [];
let hack_queue = [];
let batch_queue = [];
let nic_queue = [];

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
	
	while (true)
	{
		await GetMessages(ns);

		if (messages.length > 0)
		{
			await QueueMessages();
		}
		
		await ns.sleep(1);
	}
}

/** @param {NS} ns */
async function GetMessages(ns)
{
	for (let i = 1; i <= 20; i++)
	{
		let peek = ns.peek(i);
		if (peek != "NULL PORT DATA")
		{
			let data = ns.readPort(i);
			messages.push(data);

			if (message_cache.length >= 5000)
			{
				message_cache.splice(0, 1);
			}
			message_cache.push(data);

			ns.print(`Message from Port ${i}: {DateTime:${data.DateTime}, Host:${data.Host}, Order:${data.Order}, Target:${data.Target}, State:${data.State}}\n`);
		}
	}
}

/** @param {NS} ns */
async function QueueMessages()
{
	for (let i = 0; i < messages.length; i++)
	{
		let message = messages[i];

		switch (message.Order)
		{
			case "Weaken":
				if (weaken_queue.length >= 200)
				{
					weaken_queue.splice(0, 1);
				}

				weaken_queue.push(message);
				messages.splice(i, 1);
				i--;
				break;

			case "Grow":
				if (grow_queue.length >= 200)
				{
					grow_queue.splice(0, 1);
				}

				grow_queue.push(message);
				messages.splice(i, 1);
				i--;
				break;

			case "Hack":
				if (hack_queue.length >= 200)
				{
					hack_queue.splice(0, 1);
				}

				hack_queue.push(message);
				messages.splice(i, 1);
				i--;
				break;

			case "Batch":
			case "/OS/Apps/Weaken.js":
			case "/OS/Apps/Grow.js":
			case "/OS/Apps/Hack.js":
				if (batch_queue.length >= 200)
				{
					batch_queue.splice(0, 1);
				}

				batch_queue.push(message);
				messages.splice(i, 1);
				i--;
				break;

			case "Purchase":
			case "Upgrade":
			case "Infect":
			case "Root":
				if (nic_queue.length >= 200)
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

	for (let i = 0; i < message_cache.length; i++)
	{
		let message = message_cache[i];
		queue.push(message);
	}

	return queue;
}

export function GetMessage_Weaken(state)
{
	if (weaken_queue.length > 0)
	{
		for (let i = 0; i < weaken_queue.length; i++)
		{
			let message = weaken_queue[i];
			if (message.State == state)
			{
				weaken_queue.splice(i, 1);
				return message;
			}
		}
	}
	
	return null;
}

export function GetMessage_Grow(state)
{
	if (grow_queue.length > 0)
	{
		for (let i = 0; i < grow_queue.length; i++)
		{
			let message = grow_queue[i];
			if (message.State == state)
			{
				grow_queue.splice(i, 1);
				return message;
			}
		}
	}
	
	return null;
}

export function GetMessage_Hack(state)
{
	if (hack_queue.length > 0)
	{
		for (let i = 0; i < hack_queue.length; i++)
		{
			let message = hack_queue[i];
			if (message.State == state)
			{
				hack_queue.splice(i, 1);
				return message;
			}
		}
	}
	
	return null;
}

export function GetMessage_Batch(state)
{
	if (batch_queue.length > 0)
	{
		for (let i = 0; i < batch_queue.length; i++)
		{
			let message = batch_queue[i];
			if (message.State == state)
			{
				batch_queue.splice(i, 1);
				return message;
			}
		}
	}
	
	return null;
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