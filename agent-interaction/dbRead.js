
var createPNNLDatabase = function(dbName) {
    var db;
    return {
      
        init: function(dbName, pnnlArr){

            var request = window.indexedDB.open(dbName, 3);

            request.onsuccess = function(event){
                db = event.target.result;
            }



            request.onupgradeneeded = function (event) {

                db = event.target.result;

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
                    console.log("upgrade database");


                    pnnlArr.forEach(function (row) {
                        pnnlObjectStore.add({
                            id1: row.id1,
                            pSite1: row.pSite1,
                            id2: row.id2,
                            pSite2: row.pSite2,
                            correlation: row.correlation,
                            pVal: row.pVal
                        });


                        pnnlObjectStore.add({
                            id1: row.id2,
                            pSite1: row.pSite2,
                            id2: row.id1,
                            pSite2: row.pSite1,
                            correlation: row.correlation,
                            pVal: row.pVal
                        });

                    });


                    console.log(pnnlArr.length);

                }
            }
        },


        getEntry: function(key, val, callback) {


            var transaction = db.transaction(["pnnlStore"]);
            var objectStore = transaction.objectStore("pnnlStore");

            // console.log(objectStore);
            var index = objectStore.index(key);

            // console.log(index);
            var singleKeyRange = IDBKeyRange.only(val);

            var res = [];
            index.openCursor(singleKeyRange).onsuccess = function (event) {

                console.log(val);

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


        getColumn(key, callback){

            var transaction = db.transaction(["pnnlStore"]);
            var objectStore = transaction.objectStore("pnnlStore");

            // console.log(objectStore);
            var index = objectStore.index(key);


            var res = [];

            index.openCursor().onsuccess = function (event) {



                var cursor = event.target.result;

                if (cursor) {
                    res.push(cursor.value[key]);
                    cursor.continue();
                }
                else {
                    if(callback)
                        callback(res);
                    return res;
                }

            };

        }


    }

}

