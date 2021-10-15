import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-analytics.js";
import * as firebase from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";
const firebaseConfig = {
    apiKey: "AIzaSyCTGhPhTaSL88TdHhAWcj3Ct2OMFRGviVU",
    authDomain: "beatthepotatov2.firebaseapp.com",
    databaseURL: "https://beatthepotatov2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "beatthepotatov2",
    storageBucket: "beatthepotatov2.appspot.com",
    messagingSenderId: "1051671577545",
    appId: "1:1051671577545:web:f932b11580b021c8e21e18",
    measurementId: "G-YF6YZWSZ6F"
};
// Initialize Firebase
const app =initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = firebase.getDatabase();
const set = firebase.set
const get = firebase.get
const ref = firebase.ref
const push = firebase.push
const child = firebase.child
const alert_html =`<div class="alert alert-info alert-dismissible fade show" id="copyalert" role="alert">Room Code Copied To Clipboard!<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`
const error_html =`<div class="alert alert-warning alert-dismissible fade show" id="copyalert" role="alert">Room Unavailable<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`

let curr_ref;
let user_mark;
let oppo_mark;
let oppo_name;
let user_name ='You';
let deck={"X":[],"O":[],};
let local={"X":[],"O":[],};
document.getElementById('createbtn').addEventListener('click',create_room);
document.getElementById('joinbtn').addEventListener('click',join_room);
function create_room(){
    let username = document.getElementById('username').value
    user_name = username;
    const roomListRef = ref(db, 'room/');
    const newRoomRef = push(roomListRef);
    curr_ref = newRoomRef.key
    user_mark = "X"
    oppo_mark = "O"
    Initiate_game()
    set(newRoomRef, {
        allow:true,
        turn:'X',
        x_user:username,
    });
    navigator.clipboard.writeText(curr_ref);
    document.getElementById('alert').innerHTML=alert_html;
    document.getElementById('roombox').classList.add("d-none")
}
function join_room(){
    let roomcode = document.getElementById('room_code').value
    let username = document.getElementById('username').value
    document.getElementById('yourturn').classList.remove('border-5','border-bottom','fw-bold')
    document.getElementById('oppoturn').classList.add('border-5','border-bottom','fw-bold')
    if(roomcode==''){
        document.getElementById('alert').innerHTML=error_html;
        return
    }
    get(child(ref(db),`room/`)).then((snapshot) => {
        if (snapshot.hasChild(roomcode)) {
            if(snapshot.child(roomcode).val().allow){
                
                curr_ref = roomcode
                user_mark = "O"
                oppo_mark = "X"
                Initiate_game()
                firebase.update(ref(db,`room/${roomcode}/`),{
                    allow:false,
                    o_user:username,
                })
                document.getElementById('roombox').classList.add("d-none")
            }else{
                document.getElementById('alert').innerHTML=error_html;
                return    
            }
        } else {
            document.getElementById('alert').innerHTML=error_html;
            return
        }
    })
}
function Initiate_game(){
    console.log('init...')
    var cells = document.getElementsByClassName("cell");
    for (var i = 0; i < cells.length; i++) {
        let index = cells.item(i).id
        if(index>9){
            cells.item(i).addEventListener('click',()=>{post(index)})
        }
    }
    document.getElementById('turn').classList.remove('d-none')
    const commentsRef = ref(db, 'room/' + curr_ref);
    firebase.onChildAdded(commentsRef, (data) => {
        
        if(isNumeric(data.key)){
            if(parseInt(data.key)>0 && parseInt(data.key)<=100){
                console.log('if chla')
                document.getElementById(data.key).innerText = data.val();
                deck[data.val()].push(parseInt(data.key))
                win_check_fr()
                if(local['X'].includes(parseInt(data.key)%10) || local['O'].includes(parseInt(data.key)%10)){
                    for(let i=1;i<10;i++){
                        if(i==parseInt(data.key)%10){
                            document.getElementsByClassName(`cover${i}`)[0].classList.remove('d-none')
                            console.log('blur except:',i)
                        }
                        else if(document.getElementsByClassName(`cover${i}`)[0].innerText ==''){
                            document.getElementsByClassName(`cover${i}`)[0].classList.add('d-none')
                        }
                    }
                }else{
                    for(let i=1;i<10;i++){
                        if(i==parseInt(data.key)%10 ){
                            console.log('blur except:',i)
                            document.getElementsByClassName(`cover${i}`)[0].classList.add('d-none')
                            continue
                        }
                        if(document.getElementsByClassName(`cover${i}`)[0].innerText ==''){
                            document.getElementsByClassName(`cover${i}`)[0].classList.remove('d-none')
                        }
                    }
                }
            }
        }
        if(data.key == 'o_user' && user_mark!='O'){
            oppo_name = data.val()
            if(oppo_name==''){
                oppo_name = 'Player2'
            }
            document.getElementById('alert').innerHTML = `<div class="alert alert-success alert-dismissible fade show" id="copyalert" role="alert">${data.val()} Joined!<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`
            document.getElementById('oppoturn').innerText = `${oppo_name}`
        }
        if(data.key == 'x_user' && user_mark!='X'){
            oppo_name = data.val()
            if(oppo_name==''){
                oppo_name = 'Player1'
            }
            document.getElementById('oppoturn').innerText = `${oppo_name}`
        }
    });
    
    window.onbeforeunload = (e)=>{
        get(child(ref(db),`room/${curr_ref}/`)).then((snapshot)=>{
            if(!snapshot.val().allow){
                firebase.update(ref(db,`room/${curr_ref}`),{
                    allow:true,
                })
            }else{
                firebase.update(ref(db,`room/`),{
                    [curr_ref]:null,
                })
            }
        })
    }
    firebase.onChildChanged(commentsRef,(data)=>{
        if(data.key =='allow' && data.val()==true){
            document.getElementById('alert').innerHTML = `<div class="alert alert-danger alert-dismissible fade show" id="copyalert" role="alert">${oppo_name} Left!<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`    
        }
        if(data.key == 'turn'){
            console.log('turn changed')
            if(data.val()==user_mark){
                document.getElementById('yourturn').classList.add('border-5','border-bottom','fw-bold')
                document.getElementById('oppoturn').classList.remove('border-5','border-bottom','fw-bold')
            }else{
                document.getElementById('yourturn').classList.remove('border-5','border-bottom','fw-bold')
                document.getElementById('oppoturn').classList.add('border-5','border-bottom','fw-bold')
            }
        }
    })
}
function post(index){
    console.log("Index Clicked",index)
    get(child(ref(db),`room/${curr_ref}/`)).then((snapshot)=>{
        if(snapshot.val().turn == user_mark && !snapshot.hasChild(index)){
            document.getElementById(`${index}`).innerText = user_mark;
            firebase.update(ref(db,`room/${curr_ref}/`),{
                turn:oppo_mark,
                [index]:user_mark,
            })
        }else{
            alert('Opponent\'n Turn')
        }
    })
    
}
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function win_check_fr(){
    console.log('wincheck chla')
    let win_condition=[[1,2,3],[4,5,6],[7,8,9],[1,5,9],[3,5,7],[1,4,7],[2,5,8],[3,6,9]]
    console.log("X:",local["X"])
    console.log("O:",local["O"])
    for(let i=0;i<win_condition.length;i++){
        for(let j=1;j<10;j++){
            if(win_condition[i].every(val=> deck["X"].includes((j*10)+val))){
                document.getElementsByClassName(`cover${j}`)[0].classList.remove('d-none');
                document.getElementsByClassName(`cover${j}`)[0].innerText = 'X'
                if(!local['X'].includes(j)){
                    local['X'].push(j)
                }
                
            }else if(win_condition[i].every(val=> deck["O"].includes((j*10)+val))){
                document.getElementsByClassName(`cover${j}`)[0].classList.remove('d-none');
                document.getElementsByClassName(`cover${j}`)[0].innerText = 'O'
                if(!local['O'].includes(j)){
                    local['O'].push(j)
                }
            }
        }
        if(win_condition[i].every(val=> local["X"].includes(val))){
            document.getElementById('winbox').classList.remove('d-none');
            if(user_mark=='X'){
                document.getElementById('wintext').innerText = `${user_name} Won!`
            }else{
                document.getElementById('wintext').innerText = `${oppo_name} Won!`
            }
            return
        }else if(win_condition[i].every(val=> local["O"].includes(val))){
            document.getElementById('winbox').classList.remove('d-none');
            if(user_mark=='O'){
                document.getElementById('wintext').innerText = `${user_name} Won!`
            }else{
                document.getElementById('wintext').innerText = `${oppo_name} Won!`
            }
            return
        }
    }
}

function reset(){
    var cells = document.getElementsByClassName("cell");
    for (var i = 0; i < cells.length; i++) {
        let index = cells.item(i).id
        if(parseInt(index)>9){
            cells.item(i).innerText =''
        }
    }
    var cover = document.getElementsByClassName("cover");
    for (var i = 0; i < cover.length; i++) {
        cover.item(i).innerText=''
        cover.item(i).classList.add('d-none')
    }
    firebase.update(ref(db,`room/`),{
        [curr_ref]:null,
    })
    set(ref(db,`room/${curr_ref}/`),{
        allow:false,
        turn:'O',
    })
    deck={"X":[],"O":[],};
    local = {"X":[],"O":[],};
    document.getElementById('winbox').classList.add('d-none');
    document.getElementById('wintext').innerText = ''
}
document.getElementById('reset').addEventListener('click',reset);