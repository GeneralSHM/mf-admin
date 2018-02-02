let modals = `
<div id="crawl-finish" class="modal">
    <div class="modal-content">
        <p>The crawl has finished susessfully!</p>
    </div>
    <div class="modal-footer">
        <a href="#!" class=" modal-action modal-close waves-effect waves-green btn-flat">Reload page</a>
    </div>
</div>
<div id="add-item" class="modal">
    <div class="modal-content">
        <h4>Add item</h4>
		 <div class="row">
			<form class="col s12">
                <div class="row">
                    <div class="input-field col s6">
                        <input id="addItemName" type="text" class="validate" required>
                        <label for="addItemName">Item name in MF</label>
                    </div>
                    <div class="input-field col s6">
                        <input id="addUrl" type="text" class="validate" required>
                        <label for="addUrl">MF URL</label>
                    </div>
                </div>
			</form>
		  </div>
	</div>
    <div class="modal-footer">
        <a href="#!" class="modal-action modal-close waves-effect waves-red btn-flat">Cancel</a>
        <a id="add-item-btn" class="modal-action modal-close waves-effect waves-red btn-flat red lighten-3">Add</a>
    </div>
</div>
<div id="add-brand" class="modal">
    <div class="modal-content">
        <h4>Add brand</h4>
		 <div class="row">
			<form class="col s12">
                <div class="row">
                    <div class="input-field col s12">
                            <input id="addBrandName" type="text" class="validate" required>
                        <label for="addBrandName">Brand name</label>
                    </div>
                </div>
			</form>
		 </div>
	</div>
    <div class="modal-footer">
        <a href="#!" class="modal-action modal-close waves-effect waves-red btn-flat">Cancel</a>
        <a id="add-brand-btn" class="modal-action modal-close waves-effect waves-red btn-flat red lighten-3">Add</a>
    </div>
</div>
<div id="edit-item" class="modal">
    <div class="modal-content">
        <h4>Edit item</h4>
		 <div class="row">
            <form class="col s12">
                <div class="row">
                    <div class="input-field col s6">
                        <input id="amazon-name" type="text" class="validate" required>
                        <label for="amazon-name">Amazon name</label>
                    </div>
                    <div class="input-field col s6">
                        <input id="amazon-price" type="text" class="validate" required>
                        <label for="amazon-price">Amazon price</label>
                    </div>
                </div>
            </form>
		  </div>
	</div>
    <div class="modal-footer">
        <a href="#!" class="modal-action modal-close waves-effect waves-red btn-flat">Cancel</a>
        <a id="edit-item-btn" class="modal-action modal-close waves-effect waves-red btn-flat red lighten-3">Edit</a>
    </div>
</div>
<div id="upload-csv" class="modal">
    <div class="modal-content">
        <h4>Upload CSV for parsing</h4>
		 <div class="row">
            <form class="col s12">
                <div class="row">
                    <div class="file-field input-field">
                        <div class="btn">
                           <span>File</span>
                           <input id="upload-input" type="file" name="csv" accept=".csv">
                        </div>
                        <div class="file-path-wrapper">
                           <input class="file-path validate" type="text">
                        </div>
                    </div>
                </div>
            </form>
		  </div>
	</div>
    <div class="modal-footer">
        <a href="#!" class="modal-action modal-close waves-effect waves-red btn-flat">Cancel</a>
        <a id="upload-item-btn" class="modal-action modal-close waves-effect waves-red btn-flat red lighten-3">Upload</a>
    </div>
</div>
<div id="upload-fail" class="modal">
    <div class="modal-content">
        <h4>Failed to parse:</h4>
		 <div id="fail-table"></div>
	</div>
    <div class="modal-footer">
        <a href="#!" class="modal-action modal-close waves-effect waves-red btn-flat">Close</a>
    </div>
</div>


`;

module.exports = modals;