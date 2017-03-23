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
`;

module.exports = modals;