/** @param {NS} ns */
export function Write(ns, name, object)
{
	try
	{
		let fileName = `/Hax/Database/${name}.txt`;
		let str = JSON.stringify(object);
		ns.write(fileName, str, "w");

		Index(ns, fileName);
		return true;
	}
	catch (error)
	{
		return false;
	}
}

/** @param {NS} ns */
export function Read(ns, name)
{
	let str = ns.read(`/Hax/Database/${name}.txt`);
	if (str)
	{
		return JSON.parse(str);
	}
	
	return null;
}

/** @param {NS} ns */
function Index(ns, name)
{
	let index = Read(ns, "index");
	if (index == null)
	{
		index = [];
	}

	if (!index.includes(name))
	{
		index.push(name);
		let str = JSON.stringify(index);
		ns.write("/Hax/Database/index.txt", str, "w");
	}
}