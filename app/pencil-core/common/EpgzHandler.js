function EpgzHandler(controller) {
    FileHandler.call(this);
    this.controller = controller;
    this.type = ".epgz";
}

__extend(FileHandler, EpgzHandler);

EpgzHandler.prototype.loadDocumentImpl = function(filePath, callback) {
    ApplicationPane._instance.busy();
    this.controller.applicationPane.pageListView.restartFilterCache();
    Pencil.documentHandler.resetDocument();
    var thiz = this;
    if (!fs.existsSync(filePath)) {
        Dialog.error("File doesn't exist", "Please check if your file was moved or deleted.");
        thiz.removeRecentFile(filePath);
        ApplicationPane._instance.unbusy();
        Pencil.documentHandler.newDocument()
        if (callback) callback();
        return;
    };
    var targz = require('targz');
    try {
        targz.decompress(
        {
            src: filePath,
            dest: Pencil.documentHandler.tempDir.name
        }, function(err) {
            if(err) {
                thiz.parseOldFormatDocument(filePath, callback);
                ApplicationPane._instance.unbusy();
            } else {
                thiz.parseDocument(filePath, callback);
            }
        });
    } catch(e) {
        thiz.parseOldFormatDocument(filePath, callback);
        ApplicationPane._instance.unbusy();
    }
}

EpgzHandler.prototype.saveDocumentImpl = function (documentPath, onSaved) {
    if (!this.controller.doc) throw "No document";
    if (!documentPath) throw "Path not specified";

    this.controller.updateCanvasState();
    this.controller.oldPencilDoc = false;

    var thiz = this;
    ApplicationPane._instance.busy();
    this.controller.serializeDocument(function () {
    this.controller.addRecentFile(documentPath, this.controller.getCurrentDocumentThumbnail());
    var targz = require('targz');
    targz.compress({
    src: Pencil.documentHandler.tempDir.name,
    dest: documentPath,
    tar: {
        dereference : true
    }
    }, function(err){
        if(err) {
            return;
        } else {
            thiz.controller.sayDocumentSaved();
            ApplicationPane._instance.unbusy();
            if (onSaved) onSaved();
        }
    });
    }.bind(this));
    thiz.controller.applicationPane.onDocumentChanged();
    thiz.controller.sayControllerStatusChanged();
};
