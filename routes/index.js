var express = require('express');
var router = express.Router();

//DataBase
var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var url = 'mongodb://localhost:27017/API-Proyecto';

router.get('/', function(req, res, next) {
  res.render('index', { title: 'API PROYECTO' });
});

//Registrar un usuario
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

//Ingresar a la aplicación con nickname y password
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

/*Modificar contraseña de un usuario*/
router.get('/modifyPassword', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('users').update({"nickname":"Maria"},{$set : {"password" : "complete"}}, function(err, result) {
      res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
  });
});

/*Unirse a un grupo al cual deseo participar*/
router.post('/addUserGroup', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err); //Inserta en groups el nombre del usuario
    db.collection('groups').update({"name":req.body.name},{$push : {"users" : req.body.users}}, function(err, result) {
      addGroupUser(req.body.users,req.body.name);
    });
  });
  var addGroupUser= function(user,group){
    var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);//Inserta en user el nombre del grupo en que participa
      db.collection('users').update({"nickname": user},{$push : {"guest" : group}}, function(err, result) {
        console.log("User: "+req.body.users+ ", Groups: "+req.body.name);
      });
     });
  };
});

/*Crear alerta en un grupo*/
router.post('/addAlert', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('groups').update({"name":req.body.names},{$push : {"alerts" : req.body.alerts}}, 
      function(err, result) {
      console.log("Alerta agregada: "+req.body.alerts+ " al grupo "+req.body.names);
    });
  });
});

/*Abandonar un grupo al que un usuario pertenece*/
router.post('/deleteGroupGuest', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err); //Borrar un grupo al que pertenece un usuario
    db.collection('users').update({"nickname":req.body.nickname},
      {$pull : {"guest" : req.body.guest}}, function(err, result) {
        console.log("Grupo dejado: "+ req.body.guest);
        deleteGroupG(req.body.guest);
    });
  });
    var deleteGroupG= function(group){
    var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);//Borrar un usuario  de un grupo
      db.collection('groups').update({"name":group},
        {$pull : {"users" : req.body.nickname}}, function(err, result) {
          console.log("");
      });
    });
  }
});

/*Eliminar un grupo*/
router.post('/deleteGroupAdmi', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);//Borra el grupo de la lista del usuario que lo administra
    db.collection('users').update({"nickname":req.body.nickname},
    {$pull : {"admi" : req.body.admi}}, function(err, result) {
      deleteGroup(req.body.admi);
      deleteGroupAllUsers(req.body.admi);
      console.log("Grupo eliminado: "+ req.body.admi);
    });
  });
  var deleteGroup= function(group2){
    var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);//Borrar el grupo
      db.collection('groups').remove({"name":group2}, function(err, result) {
          console.log("Grupo "+group2+" borrado.");
      });
     });
  };
  var deleteGroupAllUsers= function(group){
    var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);//Borrar el grupo
      db.collection('users').update({},{$pull : {"guest" : group}}, function(err, result) {
          console.log("Grupo "+group+" borrado.");
      });
     });
  };
});

/*Crear un grupo*/
router.post('/insertGroup', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('groups').insert(req.body.group, function(err, result) {
      res.send((err === null) ? { msg: 'true' } : { msg: err });
      console.log(req.body.group);
       addGroupUserAdmi(req.body.users,req.body.group.name);
    });
  });
 var addGroupUserAdmi= function(user,group){
  var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err); //Agregar un grupo que administro
        db.collection('users').update({"nickname":user},{$push : {"admi" : group}}, 
          function(err, result) {console.log("User: "+req.body.users+ ", Group: "+req.body.group.name);
        });
    });
  };
});

//Mostrar grupos a los que pertenece un usuario
router.post('/groupsGuest', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){
      db.collection('users').find({"nickname" : req.body.nickname}).toArray(function (err, items) {
        db.close();
        res.json(items[0].guest);
        console.log(items[0].guest);
      });
    }
    else{
      console.log(err);
    }
  });
});

//Mostrar grupos que administra un usuario
router.post('/groupsAdmi', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){
      db.collection('users').find({"nickname" : req.body.nickname}).toArray(function (err, items) {
        db.close();
        res.json(items[0].admi);
        console.log(items[0].admi);
      });
    }
    else{
      console.log(err);
    }
  });
});

/*Obtener las alertas de un usuario*/
var q = require('q');
router.post('/alerts', function(req, res) {
  var promises = [], resultAlert = [];
  var id = 0;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){ //Con el nickname del usuario obtiene las alertas
      db.collection('users').find({"nickname" : req.body.nickname}).toArray(function (err, items) {
        db.close();

        for(var i = 0; i < items[0].admi.length; i++){ //Ciclo para obtener las alertas de los grupos que administra el usuario
          promises.push(getAlerts(items[0].admi[i]));
        }
        for(var k = 0; k < items[0].guest.length; k++){ //Ciclo para obtener las alertas de los grupos en que participa el usuario
          promises.push(getAlerts(items[0].guest[k]));
        }
        q.all(promises).then(function(alerts) {       
          for (var j = 0; j < promises.length; j++) { //Ciclo para ordenar las alertas de los grupos en un solo arreglo "resultAlert"           
            for (var i = 0; i < promises[j].length; i++) { 
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
    var getAlerts= function(group){
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

//Muestra en el mapa solo los grupos a los que pertenece el usuario
router.post('/groupsMap', function(req, res) {
  var promises = [];
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){ //Con el nickname del usuario obtienen los grupos
      db.collection('users').find({"nickname" : req.body.nickname}).toArray(function (err, items) {
        db.close();
        for(var i = 0; i < items[0].guest.length; i++){ 
          promises.push(getGroupsMap(items[0].guest[i]));
        }
        for(var i = 0; i < items[0].admi.length; i++){ 
          promises.push(getGroupsMap(items[0].admi[i]));
        }
        q.all(promises).then(function(groupsMap) {       
          console.log(promises);
          res.json(promises); 
        }).catch(function(err) {
          res.json(err);
        });
      });
    }
    else{
      console.log(err);
    }
  });
    var getGroupsMap= function(group){
      var deferred = q.defer();
      MongoClient.connect(url, function(err, db) {
        if(err) { 
          deferred.reject(err);
        } //Busca los grupos asociados a un usuario
        db.collection('groups').find({"name":group},{"name":1,"coord":1}).toArray(function (err, items) {
          if(err) { 
            deferred.reject(err);
          }
          deferred.resolve(items[0]);
          db.close();
        });
      });
      return deferred.promise;
  };
});

//Muestra todos los grupos en el mapa
router.post('/groupsAll', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){//Solo devuelve el id, nombre y las coordenadas del grupo
      db.collection('groups').find({},{"name":1,"coord":1}).toArray(function (err, items) { 
        db.close();
        res.json(items);
      });
    }
    else{
      console.log(err);
    }
  });
});

/*Eliminar persona de un grupo (solo la persona que creo el grupo y es el administrador puede hacerlo)*/
router.post('/deleteUserGroup', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err); //Borrar un grupo al que pertenece un usuario
    db.collection('groups').update({"name":req.body.name},
      {$pull : {"users" : req.body.nickname}}, function(err, result) {
        console.log("Usuario "+ req.body.nickname +" eliminado del grupo "+req.body.name);
        deleteUserG(req.body.nickname);
    });
  });
    var deleteUserG= function(user){
    var db = req.db;
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);//Borrar un usuario  de un grupo
      db.collection('users').update({"nickname":user},
        {$pull : {"guest" : req.body.name}}, function(err, result) {
          console.log("");
      });
    });
  }
});

/*Eliminar alerta de un grupo (solo la persona que creo el grupo y es el administrador puede hacerlo)*/
router.post('/deleteAlertGroup', function(req, res) {
  var db = req.db;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err); //Borrar una alerta de un grupo
    db.collection('groups').update({"name":req.body.name},
      {$pull : {"alerts" : req.body}}, function(err, result) {
        console.log("Alerta "+ req.body +" eliminada del grupo "+req.body.name);
    });
  });
});

//Muestra todos los usuarios que pertencen a un grupo
router.post('/groupsUsers', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    if(!err){//Solo devuelve el id, nombre y usuarios
      db.collection('groups').find({"name":req.body.group},{"users":1}).toArray(function (err, items) { 
        db.close();
        res.json(items[0].users);
      });
    }
    else{
      console.log(err);
    }
  });
});

module.exports = router;
