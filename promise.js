//本promise符合Promises/A+标准   Promises/A+标准地址:https://promisesaplus.com/

const { Console } = require("console");

const PENDING = 'PENDING';
const RESOLVED = 'RESOLVED';
const REJECTED = 'REJECTED';
let Num = 0;

const getType = (value)=>{
    return Object.prototype.toString.call(value).slice(8,-1)
}

//所有promise库都遵循此规范，所以这里的写法需要兼容所有promise
const resolvePromise = ((nextPromise,curentPromiseThenValue,resolve,reject)=>{
    if(curentPromiseThenValue == nextPromise){//then中onfullfilled返回的值不能和then返回的promise是同一个(原因?)
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
    }

    if(typeof curentPromiseThenValue === 'object' && curentPromiseThenValue !== null || typeof curentPromiseThenValue === 'function'){
        let called;
        try {
            let then = curentPromiseThenValue.then//这里的then有可能是通过definePropertty定义的
            if(typeof then === 'function'){//有then方法就姑且认为是一个promise,
                //此处不能通过constructor来判断是否是promise,因为规范中就是要求这么处理
                //并不是只为了判断是否是promise,还要对object和function进行处理，原因暂未领悟到
                //如果不是promise就不会调用then.call传入的onfullfilled和onrejected
                then.call(curentPromiseThenValue,data=>{//在这里用the.call为了保证不用二次取then的值避免出错
                    if(called){
                        return
                    }
                    called = true;//curentPromiseThenValue中的excutor可能会同时或者多次调用resolve和reject,此处的处理是
                    // 防止多次调用成功
                    //如果data还是promise，无限循环直到拿到的值是普通纸，再通过resolve(data)传递给nextPromise.then                                                           
                    resolvePromise(nextPromise,data,resolve,reject) 
                },reason=>{
                    if(called){
                        return
                    }
                    called = true;//防止多次调用成功
                    reject(reason)
                })
            }else{
                resolve(curentPromiseThenValue)
            }
        } catch (error) {
            if(called){//不理解
                return
            }
            called = true;
            reject(error)
        }
    }else{//普通值
        resolve(curentPromiseThenValue)
    }

})

class Promise {
    constructor(executor){
        this.status = PENDING;//默认状态
        this.value = undefined;//成功结果
        this.reason = undefined//失败原因
        this.onResolvedCallbacks = [];
        this.onRejectedCallbacks = [];
        this.length = arguments.length;
        this.Num = Num++;//此属性为了方便测试时辨认是哪个Promise

        //成功
        let resolve = (value)=>{
            //屏蔽调用,即对同一个pormise只可以调用resolve或者reject的其中一个
            if(this.status === PENDING){
                this.status = RESOLVED
                this.value = value;
                //异步executor有结果之后发布
                this.onResolvedCallbacks.forEach(fn=>fn());
            }
        }

        //失败
        let reject = (reason)=>{
            if(this.status === PENDING){
                this.status = REJECTED
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn=>fn());
            }
        }

        try {
            //传入的函数,立刻执行
            executor(resolve,reject);//这一步就有可能发生错误，就直接catch了
        } catch (e) {
            console.log('catch---',e)
            //报错执行reject
            reject(e);
        }
        
    }

    //前一个promise.then方法里的onfullfilled返回值会被promise.then创建的新promise执行该新pormise.resolve(data),
    // 这样就可以继续往下走该新pormise的then
    //这些方法核心就是调用resolve或者reject这样就可以往下走then,概括来说就是利用了promise的发布订阅模式来达到异步的目的
    then(onfullfilled,onrejected){//then中的onfullfilled,onrejected都是是异步的,下面代码中通过订阅或者setTimeout实现
        //onfullfilled,onrejected是可选参数,即onfullfilled,onrejected不传的话即onfullfilled自动往下一层传值,
        //onrejected往下一层抛错
        //此处value就是当前then所属于的promise的value,error同理
        onfullfilled = typeof onfullfilled === 'function' ? onfullfilled : value => value
        onrejected = typeof onrejected === 'function' ? onrejected : error => {throw error}

        let nextPromise = new Promise((resolve,reject)=>{
            //同步情况
            if(this.status === RESOLVED){
                setTimeout(()=>{//包裹在setTime里是为了保证nextPromise已经被return可以优先继续执行后面的then
                    //也是属于规范要求，必须异步执行
                    try {
                        let curentPromiseThenValue = onfullfilled(this.value)
                        resolvePromise(nextPromise,curentPromiseThenValue,resolve,reject)
                    } catch (error) {
                        // console.log('error--reject',reject)
                        reject(error)
                    }
                    
                })
            }

            if(this.status === REJECTED){
                setTimeout(()=>{
                    try {
                        let curentPromiseThenValue = onrejected(this.reason)
                        resolvePromise(nextPromise,curentPromiseThenValue,resolve,reject)
                    } catch (error) {
                        reject(error)
                    }
                    
                })
            }

            //异步情况先订阅
            if(this.status === PENDING){
                this.onResolvedCallbacks.push(()=>{ 
                    setTimeout(()=>{//似乎没必要包裹这一层,但是规范要求必须异步执行，其实执行顺序并没有影响，
                        // 所以必须异步的原因不清楚
                        // 推测可能是各个Pormise实现时,比如this.value赋值的顺序可能不同，所以干脆此处异步，避免这种问题
                        try {
                            let curentPromiseThenValue = onfullfilled(this.value)
                            resolvePromise(nextPromise,curentPromiseThenValue,resolve,reject)
                        } catch (error) {
                            reject(error)
                        }
                    })
                })

                this.onRejectedCallbacks.push(()=>{
                    setTimeout(()=>{
                        try {
                            let curentPromiseThenValue = onrejected(this.reason)
                            resolvePromise(nextPromise,curentPromiseThenValue,resolve,reject)
                        } catch (error) {
                            reject(error)
                        }
                        
                    })
                }) 
            }
        })

        return nextPromise;
    }

    //promise.finally:无论之前什么情况,finally里的cb必定执行，执行之后把之前传下来的data或者err再往下面传,
    // 相当于中转站，走个过场，但是在中转站中做了一些自己的事情
    // promise.finally相当于promise.then，因为返回的就是一个then，只不过做了一点处理
    finally(cb){
        return this.then(data=>{
            return Promise.resolve(cb()).then(()=>data)
        },err=>{
            return Promise.resolve(cb()).then(()=>{throw err})
        })
    }

    catch(cb){
        return this.then.call(this,undefined,cb) 
    }
}

// --------------Promise静态方法-----------------
Promise.race = function(arr){
    return new Promise((resolve,reject)=>{
        arr.forEach((p)=>{
            p.then((data)=>{
                resolve(data)
            },(err)=>{
                reject(err)
            })
        })
    })
}

Promise.all = function(values){
    return new Promise((resolve,reject)=>{
        let arr = [],
            index = 0//计步器，有异步的时候要等到计步器达到数组长度才行，此时数据才会全部被填入arr
        
        //处理数组
        function processData(key,value){
            arr[key] = value 
            if(++index === values.length){
                resolve(arr)
            }
        }
        
        for(let i=0;i<values.length;i++){
            let current = values[i]
            if(current instanceof Promise){
                current.then((data)=>{
                    processData(i,data)
                },reject)
            }else{
                processData(i,current)
            }
        }
    })
}

//iterable:[Promise,Promise,Promise.....]
Promise.allSettled = function(iterable){
    return new Promise((resolve,reject)=>{
        let arr = [],
            index = 0,
            step = 0//计步器，有异步的时候要等到计步器达到数组长度才行，此时数据才会全部被填入arr
        
        //处理数组
        function processData(status,result,index){
            let obj = {status}
            if(status === 'fulfilled'){
                obj.value = result
            }else{
                obj.reason = result
            }
            arr[index] = obj 
            step++
            if(step === iterable.length || step === iterable.size){
                resolve(arr)
            }
        }
        
        iterable.forEach((current)=>{
            if(current instanceof Promise){
                let order = index;
                current.then((data)=>{
                    processData('fulfilled',data,order)
                },(reason)=>{
                    processData('rejected',reason,order)
                })
                index++
            }else{
                return
            }
        })
    })
}

Promise.any = function(iterable){
    return new Promise((resolve,reject)=>{
        let flag = false,//是否含有任何一个Promise
            reasonArr = [],
            step = 0//计步器，有异步的时候要等到计步器达到iterable长度才行，此时reason数据才会全部被填入reasonArr

        function handleReject(reason){
            reasonArr.push(reason)
            if(step === iterable.length || step === iterable.size){
                reject(reasonArr)
            }
        }

        if(iterable.length === 0 || iterable.size === 0){
            resolve()
        }
        
        iterable.forEach((current)=>{
            if(current instanceof Promise){
                flag = true;
                current.then((data)=>{
                    resolve(data)
                },(reason)=>{
                    step++
                    handleReject(reason)
                })
            }else{
                step++ 
            }
        })

        if(!flag){
            setTimeout(resolve)
        }
    })
}

Promise.resolve = function(cbResult){
    if(cbResult instanceof Promise){
        return cbResult
    }else if(getType(cbResult) === "Object" || getType(cbResult) === "Function" && cbResult.then && getType(cbResult.then) === "Function"){
        return new Promise(cbResult.then);
    }else{
        return new Promise((resolve)=>{
            resolve(cbResult)
        })
    }
}

Promise.reject = function(reason){
    return new Promise((resolve)=>{
        reject(reason)
    })
}

// -----------进一步解决嵌套封装的问题--------------
Promise.defer = Promise.deferred = function(){
    let dfd = {}
    dfd.promise = new Promise((resolve,reject) => {
        dfd.resolve = resolve
        dfd.reject = reject
    })
    return dfd
}


module.exports = Promise;