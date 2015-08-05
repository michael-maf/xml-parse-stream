var sax = require('sax'),
    parser = sax.createStream(true, {normalize: true, trim: true}),
    fs = require('fs'),
    path = require('path'),
    stream = require('stream');

var generateXmlStream = function(fileIn, imageLocation, replaceImgPath, callback) {
  
  fs.createReadStream(fileIn, { encoding: "utf8" }).pipe(parser);
  
  var streamOut = new stream.Readable();

  streamOut._read = function() {};
 
  function entity (str) {
    return str.replace('"', '&quot;');
  }
  
  parser.on("processinginstruction", function(tag) {
    streamOut.push("<?"+tag.name+" "+tag.body+"?>");
  });
  
  parser.on("opentag", function (tag) {
    this.level ++;
    streamOut.push("<"+tag.name);
    
    for (var i in tag.attributes) {
      streamOut.push(" "+i+"=\""+entity(tag.attributes[i])+"\"");
    }
    streamOut.push(">");
  });
  
  parser.on("text", function(text) {
      var _parser = this._parser;
      var parent = _parser.tags[_parser.tags.length - 1];
      
        if(_parser.tag.name === "init_from" && replaceImgPath && parent && parent.name === "image") {
          streamOut.push(imageLocation.shift());
        }
        else {
          streamOut.push(text);
        }
      
  });
  
  parser.on("doctype", function(text) {
    streamOut.push(text);
  });
  
  parser.on("closetag", function (tag) {
    this.level --;
    streamOut.push("</"+tag+">");
    
    //switch text parser on library_image closetag...
    if(tag === "library_images") {
      parser.removeListener("text", function() {
        parser.on("text", function(text) {
            streamOut.push(text);
        });
      });
    }
  });
  
  parser.on("cdata", function (data) {
    streamOut.push("<![CDATA["+data+"]]>");
  });
  
  parser.on("comment", function (comment) {
    streamOut.push("<!--"+comment+"-->");
  });
  
  parser.on("error", function (error) {
    console.error(error);
    throw error;
  });
  
  parser.on("end", function() {
    callback(null, streamOut);
  });
};

module.exports = generateXmlStream;