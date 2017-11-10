
class LoginView {
    constructor(connection, request) {}

    addStyles() {
        return `
            <style>
                body {
                    display: flex;
                    min-height: 100vh;
                    flex-direction: column;
                }
                
                main {
                    flex: 1 0 auto;
                }
                
                body {
                    background: #fff;
                }
                
                .input-field input[type=date]:focus + label,
                .input-field input[type=text]:focus + label,
                .input-field input[type=text]:focus + label,
                .input-field input[type=password]:focus + label {
                    color: #e91e63;
                }
                
                .input-field input[type=date]:focus,
                .input-field input[type=text]:focus,
                .input-field input[type=email]:focus,
                .input-field input[type=password]:focus {
                    border-bottom: 2px solid #e91e63;
                    box-shadow: none;
                }
                
                .container {
                    text-align: center;
                }
            </style>
            
            <div class="container">
                <div class="z-depth-1 grey lighten-4 row" style="display: inline-block; padding: 32px 48px 0px 48px; border: 1px solid #EEE;">
                    <form id='login-form' class="col s12" method="post">
                        <div class='row'>
                            <div class='col s12'>
                            </div>
                        </div>
                    
                        <div class='row'>
                            <div class='input-field col s12'>
                                <input class='validate' type='text' name='username' id='username' />
                                <label for='username'>Enter your username</label>
                            </div>
                        </div>
                        
                        <div class='row'>
                            <div class='input-field col s12'>
                                <input class='validate' type='password' name='password' id='password' />
                                <label for='password'>Enter your password</label>
                            </div>
                            <label style='float: right;'>
                                <a class='pink-text' href='#!'><b id="error"></b></a>
                            </label>
                        </div>
                        <br />
                        <center>
                        <div class='row'>
                            <button type='submit' name='btn_login' class='col s12 btn btn-large waves-effect indigo'>Login</button>
                        </div>
                        </center>
                    </form>
                </div>
            </div>
        `;
    }

    compile() {
        return new Promise((resolve, reject) => {
            resolve(this.addStyles());
        });
    }
}

module.exports = LoginView;
