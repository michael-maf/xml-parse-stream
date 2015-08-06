var sax = require('sax'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    stream = require('stream'),
    Transform = stream.Transform,
    Duplex = stream.Duplex,
    PassThrough = stream.PassThrough,
    SAXStream = sax.SAXStream;
    
function DuplexThrough(options) {
  if (!(this instanceof DuplexThrough)) {
    return new DuplexThrough(options);
  }
  Duplex.call(this, options);
  this.inRStream = new PassThrough();
  this.outWStream = new PassThrough();
  this.leftHandlersSetup = false; // only setup the handlers once
  this.saxStream = sax.createStream(true, {normalize: true, trim: true});
  this.inRStream.pipe(this.saxStream);
}
util.inherits(DuplexThrough, Duplex);

/* left inbound side */
DuplexThrough.prototype._write =
  function (chunk, enc, cb) {
    this.inRStream.write(chunk, enc, cb);
  };

/* left outbound side */
/**
 * The first time read is called we setup listeners
 */
DuplexThrough.prototype.setupLeftHandlersAndRead = function (n) {
  var self = this;
  self.leftHandlersSetup = true; // only set handlers up once
    function entity (str) {
        return str.replace('"', '&quot;');
    }
    
    var parser = self.saxStream;
  
    parser.on("processinginstruction", function(tag) {
        self.push("<?"+tag.name+" "+tag.body+"?>");
    });
    
    parser.on("opentag", function (tag) {
        this.level ++;
        self.push("<"+tag.name);
    
        for (var i in tag.attributes) {
            self.push(" "+i+"=\""+entity(tag.attributes[i])+"\"");
        }
        self.push(">");
    });
    
    parser.on("text", function(text) {
        var _parser = this._parser;
        var parent = _parser.tags[_parser.tags.length - 1];
        
        if(_parser.tag.name === "init_from" && parent && parent.name === "image") {
            self.push(path.basename(text));
        }
        else {
            self.push(text);
        }
        
    });
    
    parser.on("doctype", function(text) {
        self.push(text);
    });
    
    parser.on("closetag", function (tag) {
        this.level --;
        self.push("</"+tag+">");
        
        //switch text parser on library_image closetag...
        if(tag === "library_images") {
            parser.removeListener("text", function() {
                parser.on("text", function(text) {
                    self.push(text);
                });
            });
        }
    });
    
    parser.on("cdata", function (data) {
        self.push("<![CDATA["+data+"]]>");
    });
    
    parser.on("comment", function (comment) {
        self.push("<!--"+comment+"-->");
    });
    
    parser.on("error", function (error) {
        console.error(error);
        throw error;
    });
    
    parser.on("end", function() {
        self.push(null);
    });
};

DuplexThrough.prototype.readLeft = function (n) {
  var chunk;
  while (null !== (chunk = this.outWStream.read(n))) {
    // if push returns false, stop writing
    if (!this.push(chunk)) break;
  }
};

DuplexThrough.prototype._read = function (n) {
  // first time, setup handlers then read
  if (!this.leftHandlersSetup) {
    return this.setupLeftHandlersAndRead(n);
  }
  // otherwise just read
  this.readLeft(n);
};


module.exports = new DuplexThrough();