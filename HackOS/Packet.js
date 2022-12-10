import {Data} from "./HackOS/Data.js";

export class Packet
{
    constructor(request, source, destination, data)
    {
        this.request = request;
        this.source = source;
        this.destination = destination;
        this.data = data;
    }
}