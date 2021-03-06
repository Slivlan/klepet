function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function divElementHtmlSlika(sporocilo) {
  return $('<div style="padding-left: 20px;"><img src="' + sporocilo + '" alt="Slika" style="width:200px;"></div>');
}

function divElementHtmlVideo(sporocilo) {
  sporocilo = sporocilo.replace("watch?v=", "v/");
  return $('<div style="padding-left: 20px;"><iframe width="200px" height="150px" src="'+ sporocilo +'"frameborder="0" allowfullscreen></iframe></div>');
  
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  }
  else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
    
    var besede = sporocilo.split(' ');
    //console.log(besede);
    for (var i = 0; i < besede.length; i++){
      if((besede[i].substr(0, 7) == 'http://' || besede[i].substr(0, 8) == 'https://')  && (besede[i].substr(besede[i].length -4, 4)=='.jpg' || besede[i].substr(besede[i].length -4, 4)=='.png' || besede[i].substr(besede[i].length -4, 4)=='.gif')){
        //console.log("YAY");
        $('#sporocila').append(divElementHtmlSlika(besede[i]));
      }
      if(besede[i].substr(0,29)=='https://www.youtube.com/watch'){
        //console.log("yay");
        $('#sporocila').append(divElementHtmlVideo(besede[i]));
      }
      
    }
  
  
    
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    var sporocilo2 = sporocilo.besedilo;
    var besede = sporocilo2.split(' ');
    //console.log(besede);
    $('#sporocila').append(novElement);
    for (var i = 0; i < besede.length; i++){
      if((besede[i].substr(0, 7) == 'http://' || besede[i].substr(0, 8) == 'https://')  && (besede[i].substr(besede[i].length -4, 4)=='.jpg' || besede[i].substr(besede[i].length -4, 4)=='.png' || besede[i].substr(besede[i].length -4, 4)=='.gif')){
        //console.log("YAY");
        $('#sporocila').append(divElementHtmlSlika(besede[i]));
      }
      if(besede[i].substr(0,29)=='https://www.youtube.com/watch'){
        //console.log("yay");
        $('#sporocila').append(divElementHtmlVideo(besede[i]));
      }
      
    }
    
    
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    $('#seznam-uporabnikov div').click(function(){
      $('#poslji-sporocilo').val('/zasebno "' + $(this).text() + '" ');
      $('#poslji-sporocilo').focus();
    });
  });
  
  socket.on('dregljaj', function(receiver){
    $('#vsebina').jrumble({
      x: 15,
      y: 15,
      rotation: 3
    });
    $('#vsebina').trigger('startRumble');
    var timeout = 1500;
    setTimeout(function(){
      $('#vsebina').trigger('stopRumble');
    }, timeout);
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
