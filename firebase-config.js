
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

export const firebaseConfig = {
    apiKey: "AIzaSyC8jZZ8LxJ17q8qtYtj7r-631GPdhx1xmY",
    authDomain: "inventario-negocio-11766.firebaseapp.com",
    databaseURL: "https://inventario-negocio-11766-default-rtdb.firebaseio.com",
    projectId: "inventario-negocio-11766",
    storageBucket: "inventario-negocio-11766.firebasestorage.app",
    messagingSenderId: "335276621864",
    appId: "1:335276621864:web:216cdc3fbac151f10d351d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
