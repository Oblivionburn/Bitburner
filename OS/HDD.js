/**
 * Stores an object in a txt file (overwrites if file exists)
 * @param {NS} ns
 * @param {string} name The name of the txt file
 * @param {object} object The object being stored
 */
export function Write(ns, name, object)
{
	try
	{
		let fileName = `/OS/HDD/${name}.txt`;
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

/**
 * Returns the object stored in a txt file
 * @param {NS} ns
 * @param {string} name Name of the txt file to read
 */
export function Read(ns, name)
{
	let str = ns.read(`/OS/HDD/${name}.txt`);
	if (str)
	{
		return JSON.parse(str);
	}
	
	return null;
}

function Index(ns, name)
{
	let index = Read(ns, "Index");
	if (index == null)
	{
		index = [];
	}

	if (!index.includes(name))
	{
		index.push(name);
		let str = JSON.stringify(index);
		ns.write("/OS/HDD/Index.txt", str, "w");
	}
}