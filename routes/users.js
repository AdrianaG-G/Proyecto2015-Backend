var express = require('express');
var router = express.Router();

//DataBase
var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var url = 'mongodb://localhost:27017/API-Proyecto';

/*Archivo para hacer pruebas en mongoDB*/
router.post('/signup', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){
      
      console.log(req.body);

      var collection = db.collection('users');
      collection.insert(req.body, function(err, result){
        db.close();
        res.send(
          (err === null) ? { msg: 'true' } : { msg: err }
        );
      });
    }
    else{
      console.log(err);
    }
  });
});

router.post('/login', function(req, res) {

  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){
      db.collection('users').find({"nickname" : req.body.nickname, "password" : req.body.password}).toArray(function (err, items) {
        db.close();
        console.log(items);
        res.json(items);
      });  
    }
    else{
      console.log(err);
    }
  });
});

/*Elimina un usuario con el nickname*/
router.get('/deleteUser', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('users').remove({"nickname":"usuario"}, function(err, result) {
      res.send((result === 1)?{ msg: ''}:{ msg:'error: '+err});
    });
  });
});

router.get('/deleteGroupGuest', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('users').update({"nickname":"prueba"},
      {$pull : {"guest" : "TEC-SSC"}}, function(err, result) {
        console.log("Grupo dejado");
    });
  });
});

router.get('/alertsUnique', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){

      db.collection('groups').find({"name":"Santa Clara"}).toArray(function (err, items) {
        db.close();
        res.json(items[0].alerts[0]);
      });
    }
    else{
      console.log(err);
    }
  });
});

router.get('/groupsAll', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){
      db.collection('groups').find().toArray(function (err, items) {
        db.close();
        res.json(items);
      });
    }
    else{
      console.log(err);
    }
  });
});

router.get('/addUserGroup', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err); //Inserta en groups el nombre del usuario
    db.collection('groups').update({"name":"TEC"},{$push : {"users" : "Adriana"}}, function(err, result) {
      addGroupUser("Adriana","TEC");
    });
  });
  var addGroupUser= function(user,group){
    var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);//Inserta en user el nombre del grupo en que participa
      db.collection('users').update({"nickname": user},{$push : {"guest" : group}}, function(err, result) {
      });
     });
  };
});

/*Dejar grupo*/
router.get('/deleteGroup', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('groups').update({"name":"TEC-SSC"},
      {$pull : {"users" : "prueba"}}, function(err, result) {
        console.log("Grupo dejado");
    });
  });
});

/*Eliminar un grupo*/
router.get('/deleteGroups', function(req, res) {
  var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);//Borrar el grupo
      db.collection('groups').remove({"name":"TEC"}, function(err, result) {
          console.log("Borrado");
      });
     });
});

/*Crear un grupo*/
router.get('/insertGroup', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('groups').insert({"name":"Ciudad Quesada","coord":[10.323347, -84.431117],"alerts":[],"users":[]}, function(err, result) {
      res.send((err === null) ? { msg: 'true' } : { msg: err });
      console.log(req.body.group);
       addGroupUserAdmi("Ronald","Ciudad Quesada");
    });
  });
 var addGroupUserAdmi= function(user,group){
  var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err); //Agregar un grupo que administro
        db.collection('users').update({"nickname":user},{$push : {"admi" : group}}, 
          function(err, result) {console.log("LISTO");
        });
    });
  };
});

router.get('/users', function(req, res, next) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){
      var collection = db.collection('users');
      collection.find().toArray(function (err, items) {
        db.close();
        res.json(items);
      });
    }
    else{
      console.log(err);
    }
  });
});

router.get('/insertuser1', function(req, res) {
  var db = req.db;
  var userTonick = "Prueba";
  var userTopass = "12345";
  var userToemail = "prueba@gmail.com";
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('users').insert({"nickname":userTonick,"password":userTopass,"email":userToemail, "admi":["Florencia"],"guest":["Santa Clara"]}, function(err, result) {
      res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
  });
});

router.get('/borrartodo', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('groups').remove({}, function(err, result) {
      res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
  });
});

/*Obtener las alertas de un usuario*/
var q = require('q');
router.get('/alerts2', function(req, res) {
  var promises = [], resultAlert = [];
  var id = 0;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){ //Con el nickname del usuario obtiene las alertas
      db.collection('users').find({"nickname" : "Ronald"}).toArray(function (err, items) {
        db.close();

        for(var i = 0; i < items[0].admi.length; i++){ //Ciclo para obtener las alertas de los grupos que administra el usuario
          promises.push(getAlerts2(items[0].admi[i]));
        }
        for(var k = 0; k < items[0].guest.length; k++){ //Ciclo para obtener las alertas de los grupos en que participa el usuario
          promises.push(getAlerts2(items[0].guest[k]));
        }
        q.all(promises).then(function(alerts) {       
          for (var j = 0; j < promises.length; j++) { //Ciclo para ordenar las alertas de los grupos que administra el usuario en un solo arreglo "resultAlert"           
            for (var i = 0; i < promises[j].length; i++) { //Ciclo para ordenar las alertas de los grupos que administra el usuario en un solo arreglo "resultAlert"           
              resultAlert.push(promises[j][i]); 
              resultAlert[id]["id"] = id; //Agrega aun identificador temporal a la alerta
              id++; 
            };
          };
          res.json(resultAlert); //Devuelve un arreglo con las alertas en formato json
        }).catch(function(err) {
          res.json(err);
        });
      });
    }
    else{
      console.log(err);
    }
  });
    var getAlerts2= function(group){
    var deferred = q.defer();
    MongoClient.connect(url, function(err, db) {
      if(err) { 
        deferred.reject(err);
      } //Busca los grupos asociados a un usuario
      db.collection('groups').find({"name":group}).toArray(function (err, items) {
        if(err) { 
          deferred.reject(err);
        }
        deferred.resolve(items[0].alerts != "[]" ?items[0].alerts:'SERA');
        db.close();
      });
    });
    return deferred.promise;
  };
});
module.exports = router;

