let Promise = require('./Promise');
let fs = require('fs')

// fs.readFile('./demo.txt','utf8',function(err,data){

//     fs.readFile('./demo2.txt','utf8',function(err,data){
//         console.log(data)
//     })
    
// })




// let read = (url)=>{
//     let dfd = Promise.defer()
//     fs.readFile(url,'utf8',function(err,data){
//         if(err){
//             dfd.reject(err);
//         }else{
//             dfd.resolve(data);
//         }
//     })
//     return dfd.promise
// }

// read('./demo.txt').then((data)=>{
//     console.log('data----',data)
// },(err)=>{
//     console.log('err----',err)
// })

// let Promise1 = new Promise((resolve,reject)=>{
//     resolve(100)
// })

// let promise2 = Promise1.then(data=>{
    // return new Promise((resolve,reject)=>{
    //     resolve(3333)
    //     throw new Error('有问题')
    // })
    // throw new Error('有问题')
    // return promise2;

//     return {then:function(){}}
// },error=>{
//     console.log(error);
// })

// promise2.then(data=>{
//     console.log('aaa',data+1)
// },error=>{
//     console.log('bbb',error);
// })

// promise2.then(data=>{
//     // console.log('aaa',data+1)
// },error=>{
//     console.log('bbb',error);
// }).then(data=>{
//     console.log(data+1)
// },error=>{
//     console.log(error);
// })



// Promise.all([1,2,3,read('./demo.txt'),4,5]).then(data=>{
//     return(data)
// }).finally(()=>{
//     console.log(333)
// }).then(data=>{
//     console.log(data)
// })

// Promise.resolve(1).then(data=>{
//     console.log(data)
// })


//generator
//执行过程解释:
//第n次next(),会执行第n个yield，next()返回结果{value:第n个yield后面的值,done:false}
// 如果第n次next()没有yield需要执行,
// 则将在  n-1次next()对应的yield  之后的所有代码执行，next()返回结果{value:undefined,done:true},
// 如果这部分代码有return，则next()返回结果{value:return的结果,done:true}
// 另外：第n次next(data)时,n-1次yield 返回结果 data，并同时执行第n次 yield
// 注意区分是next()返回结果还是yield返回结果
// function * read1(){
//     yield 1;
//     yield 2;
//     let r = yield 3;
//     console.log(333)
//     return r
// }

// // generator(read1)

// let it = read1();

// console.log(it.next())
// console.log(it.next())
// console.log(it.next())
// console.log(it.next(10))

// function generator(fn){
//     let obj = {}

//     function deal(){
//         fn()

//     }

//     obj.next = function(){

//         return {
//             value: currentValue,
//             done: currentDone
//         }
//     }
// }


// var p1 = Promise.resolve({ 
//     then: function(onFulfill, onReject) { onFulfill("fulfilled!"); }
//   });
//   console.log(p1 instanceof Promise) // true, 这是一个Promise对象

//   p1.then(function(v) {
//       console.log(v); // 输出"fulfilled!"
//     }, function(e) {
//       // 不会被调用
//   });

//   // Thenable在callback之前抛出异常
//   // Promise rejects
//   var thenable = { then: function(resolve) {
//     throw new TypeError("Throwing");
//     resolve("Resolving");
//   }};

//   var p2 = Promise.resolve(thenable);
//   p2.then(function(v) {
//     // 不会被调用
//   }, function(e) {
//     console.log(e); // TypeError: Throwing
//   });

//   // Thenable在callback之后抛出异常
//   // Promise resolves
//   var thenable = { then: function(resolve) {
//     resolve("Resolving");
//     throw new TypeError("Throwing");
//   }};

//   var p3 = Promise.resolve(thenable);
//   p3.then(function(v) {
//     console.log(v); // 输出"Resolving"
//   }, function(e) {
//     // 不会被调用
//   });


// const promise1 = new Promise((resolve, reject) => {
//     setTimeout(resolve, 500, 'one');
//   });

//   const promise2 = new Promise((resolve, reject) => {
//     setTimeout(resolve, 100, 'two');
//   });

//   Promise.race([promise1, promise2]).then((value) => {
//     console.log(value);
//     // Both resolve, but promise2 is faster
//   });

// var resolvedPromisesArray = [Promise.resolve(33), Promise.resolve(44)];

// var p = Promise.race(resolvedPromisesArray);
// // immediately logging the value of p
// console.log(p);

// // using setTimeout we can execute code after the stack is empty
// setTimeout(function(){
//     console.log('the stack is now empty');
//     console.log(p);
// });


// var p1 = new Promise(function(resolve, reject) {
//     resolve('Success');
//   });
  
//   p1.then(function(value) {
//     console.log(value); // "Success!"
//     throw 'oh, no!';
//   }).catch(function(e) {
//     console.log(e); // "oh, no!"
//   }).then(function(data){
//     console.log(data)
//     console.log('after a catch the chain is restored');
//   }, function () {
//     console.log('Not fired due to the catch');
//   });


// 在异步函数中抛出的错误不会被catch捕获到
// var p2 = new Promise(function(resolve, reject) {
//   setTimeout(function() {
//     throw 'Uncaught Exception!';
//   }, 1000);
// });

// p2.catch(function(e) {
//   console.log(e); // 不会执行
// });

// try {
//   setTimeout(()=>{
//     throw 'Uncaught Exception!';
//   },1000)
// } catch (error) {
//   console.log('error---',error)
// }

// const promise1 = Promise.resolve(3);
// const promise2 = new Promise((resolve, reject) => setTimeout(reject, 100, 'foo'));
// const promises = [promise2, promise1];

// Promise.allSettled(promises).
//   then((results) => results.forEach((result) => console.log(result)));