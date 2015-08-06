var generator = require('./generator'),
  	child_process = require('child_process'),
    path = require('path'),
  	fs = require('fs'),
    async = require('async');

//to test
var samplesPath = path.join(process.cwd()+"/samples");

var samples = {
    cat: {
      file: samplesPath + "/cat/20_cat_smooth_bake_channel.dae",
      image: [samplesPath + "/cat/20_cat.png"]
    },
    cow: {
      file: samplesPath + "/cow/cow.dae",
      image: [samplesPath + "/cow/Cow.png"]
    },
    mango: {
      file: samplesPath + "/mango/mango.dae",
      image: [
        samplesPath + "/mango/img_1.png", 
        samplesPath + "/mango/img_2.png"
      ]
    },
    scout: {
      file: samplesPath + "/scout/modelo.DAE",
      image: [samplesPath + "/scout/scout_flat.jpg"]
    },
    tie_fighter: {
      file: samplesPath + "/tie_fighter/tiefighter.DAE",
      image: [samplesPath + "/tie_fighter/tieskin.jpg"]
    },
    x_wing: {
      file: samplesPath + "/x_wing/xwing.DAE",
      image: [samplesPath + "/x_wing/xwingskin.jpg"]
    }
};

//should work like this
fs.createReadStream(samples.cow.file).pipe(generator).pipe(fs.createWriteStream('./write.dae'));