
var createPNNLDatabaseFromFile = function(dbName) {
    var db;
    var lr = new LineReader();
    var pnnlArr = [];
    return {

        readIntoMemory: function(file){

            var self = this;

            var lr = new LineReader();

            var p1 = new Promise(function (resolve, reject) {
                var i = 0;
                lr.on('line', function (line, next) {
                    // console.log(line);
                    var vals = line.split("\t");

                    var id1 = vals[0].toUpperCase();
                    var id2 = vals[1].toUpperCase();


                    if (id1.indexOf('/') < 0 && id2.indexOf('/') < 0) { //exclude incorrect formats
                        var idStr1 = id1.split('-');
                        var geneName1 = idStr1[0];
                        var pSite1 = idStr1[1];

                        var idStr2 = id2.split('-');
                        var geneName2 = idStr2[0];
                        var pSite2 = idStr2[1];

                        pnnlArr.push({
                            id1: geneName1,
                            id2: geneName2,
                            pSite1: pSite1,
                            pSite2: pSite2,
                            correlation: vals[2],
                            pVal: vals[3]
                        });
                    }


                    i++;

                    if(i>= 6637546)
                        resolve("success");

                    console.log(i);

                    next();







                });

                // Begin reading the file
                lr.read(file);


            });

            p1.then(function(){
                self.init();
            })
        },

        init:  function () {
            var req = window.indexedDB.deleteDatabase(dbName);
            var request = window.indexedDB.open(dbName, 3);



            request.onerror = function (event) {
                window.alert("Database cannot be opened");
            };






            // db.onerror = function(event) {
            //     // Generic error handler for all errors targeted at this database's
            //     // requests!
            //     alert("Database error: " + event.target.errorCode);
            // };
            request.onsuccess = function (event) {

                db = event.target.result;

                console.log("Database is opened");
                // var transaction = db.transaction(["pnnlStore"]);
                // var objectStore = transaction.objectStore("pnnlStore");
                // //
                // console.log(objectStore.count());
                // //
                // var index = objectStore.index("id1");
                // //
                // console.log(index.count());

            };
            request.onupgradeneeded = function (event) {
                console.log("Store update");
                // Create an objectStore to hold information about genes.

                var objectStore = db.createObjectStore("pnnlStore", {autoIncrement: true});//{ keyPath: ['id1', 'pSite1', 'id2', 'pSite2']});

                // Create an index to search genes. We may have duplicates
                // so we can't use a unique index.

                objectStore.createIndex("id1", "id1", {unique: false});
                objectStore.createIndex("pSite1", "pSite1", {unique: false});
                objectStore.createIndex("id2", "id2", {unique: false});
                objectStore.createIndex("pSite2", "pSite2", {unique: false});
                objectStore.createIndex("correlation", "correlation", {unique: false});
                objectStore.createIndex("pVal", "pVal", {unique: false});
                var pnnlObjectStore;

                // Use transaction oncomplete to make sure the objectStore creation is
                // finished before adding data into it.

                objectStore.transaction.oncomplete = function (event) {
                    pnnlObjectStore = db.transaction("pnnlStore", "readwrite").objectStore("pnnlStore");

                    pnnlArr.forEach(function(row){
                        pnnlObjectStore.add({
                            id1: row.id1,
                            pSite1: row.pSite1,
                            id2: row.id2,
                            pSite2: row.pSite2,
                            correlation: row.correlation,
                            pVal: row.pVal
                        });

                    });

                }
                // objectStore.transaction.oncomplete = function (event) {
                //     // Store values in the newly created objectStore.
                //         var  i = 0;
                //         lr.on('line', function (line, next) {
                //
                //             var vals = line.split("\t");
                //
                //             var id1 = vals[0].toUpperCase();
                //             var id2 = vals[1].toUpperCase();
                //
                //
                //             if (id1.indexOf('/') < 0 && id2.indexOf('/') < 0) { //exclude incorrect formats
                //
                //                 pnnlObjectStore = db.transaction("pnnlStore", "readwrite").objectStore("pnnlStore");
                //
                //                 var idStr1 = id1.split('-');
                //                 var geneName1 = idStr1[0];
                //                 var pSite1 = idStr1[1];
                //
                //                 var idStr2 = id2.split('-');
                //                 var geneName2 = idStr2[0];
                //                 var pSite2 = idStr2[1];
                //
                //                 try {
                //                     pnnlObjectStore.add({
                //                         id1: geneName1,
                //                         pSite1: pSite1,
                //                         id2: geneName2,
                //                         pSite2: pSite2,
                //                         correlation: vals[2],
                //                         pVal: vals[3]
                //                     });
                //
                //
                //                     // pnnlObjectStore.add({
                //                     //     id1: geneName2,
                //                     //     pSite1: pSite2,
                //                     //     id2: geneName1,
                //                     //     pSite2: pSite1,
                //                     //     correlation: vals[2],
                //                     //     pVal: vals[3]
                //                     // });
                //
                //
                //                 }
                //                 catch (e) {
                //                     console.log(e);
                //                 }
                //
                //             }
                //             // console.log(++i);
                //             next(); // Call next to resume...
                //         });
                //
                //
                //         // Begin reading the file
                //         lr.read(pnnlFile);
                //
                //
                //
                // };
            };

        },
        getEntry: function(key, val, callback) {
            var transaction = db.transaction(["pnnlStore"]);
            var objectStore = transaction.objectStore("pnnlStore");

            console.log(objectStore);
            var index = objectStore.index(key);

            console.log(index);
            var singleKeyRange = IDBKeyRange.only(val);

            var res = [];
            index.openCursor(singleKeyRange).onsuccess = function (event) {
                var cursor = event.target.result;

                if (cursor) {
                    res.push(cursor.value);
                    cursor.continue();
                }
                else {
                    if(callback)
                        callback(res);
                    return res;
                }

            };
        },


    }

}

// function getDbValue() {
//
//
//     var transaction = db.transaction(["pnnl"]);
//     var objectStore = transaction.objectStore("pnnl");
//
//     var index = objectStore.index("id1");
//
//     index.get("RANBP2").onsuccess = function (event) {
//         //  alert( event.target.result.pSite1);
//         console.log(event.target.result);
//     };
//     var singleKeyRange = IDBKeyRange.only("RANBP2");
//     // Using a normal cursor to grab whole customer record objects
//     index.openCursor(singleKeyRange).onsuccess = function (event) {
//         var cursor = event.target.result;
//
//         if (cursor) {
//             // cursor.key is a name, like "Bill", and cursor.value is the whole object.
//             console.log("Name: " + cursor.key + ", SSN: " + cursor.value.id1 + ", email: " + cursor.value.id2);
//             cursor.continue();
//         }
//     };
//
// }
// }

