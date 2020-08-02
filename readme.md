本promise符合Promises/A+标准
实现了:

    Promise.all(iterable)
    Promise.allSettled(iterable)
    Promise.any(iterable)
    Promise.race(iterable)
    Promise.reject(reason)
    Promise.resolve(value)

    Promise.prototype.catch(onRejected)
    Promise.prototype.then(onFulfilled, onRejected)
    Promise.prototype.finally(onFinally)



执行顺序:

    1.new promise(executor)--(假设名字叫做firstPromise)  时候设置好各种初始状态,status=PENDING,然后执行executor

    (注：接下来的情况以成功为例,失败的情况类似)
    
    executor,then全部为异步的情况:

    2.executor执行完毕等候异步结束调用resolve,此时开始调用firstPromise.then(onfullfilled)

    then方法中创建新的promise---nextPromise,nextPromise设置好各种初始状态,nextPromise.status=PENDING,此时执行nextPromise的executor

    在executor中,由于firstPromise.status == PENDING,所以执行firstPromise.onRejectedCallbacks.push(onfullfilled)进行firstPromise.then(onfullfilled)中的onfullfilled订阅

    接下来由于then返回了nextPromise,所以又开始调用nextPromise.then(onfullfilled)

    nextPromise.then中创建新的promise---nextPromise2,nextPromise2设置好各种初始状态,nextPromise2.status=PENDING,此时执行nextPromise2的executor

    在nextPromise的executor中,由于nextPromise.status == PENDING(因为nextPromise是在firstPromise.then中new出来的,所以在nextPromise的executor中只是进行订阅而没有调用resolve对nextPromise.status做出改变),所以在nextPromise.then中执行nextPromise.onRejectedCallbacks.push(onfullfilled)进行nextPromise.then(onfullfilled)中的onfullfilled订阅

    接下来由于then返回了nextPromise2,所以又开始调用nextPromise2.then(onfullfilled)
    余下依次全部执行,重复上述步骤

    3.第一层代码执行完毕后,firstPromise.executor此时异步结束(firstPromise.executor调用resolve才会进行新一轮的代码执行),调用resolve(data),此时firstPromise.value = data,firstPromise.status = RESOLVED,并执行firstPromise.onResolvedCallbacks.forEach(fn=>fn());

    在firstPromise.onResolvedCallbacks.forEach(fn=>fn())执行中,fn都是firstPromise.then中订阅的被包裹在setTimeout中的内容,所以setTimeout中的内容只是被放在当前event loop的宏任务中等待当前栈中的代码执行完毕再去执行

    当前栈执行完毕开始执行firstPromise的onfullfilled

    executor,then全部为同步的情况:
    2.executor执行并直接调用resolve(data),此时firstPromise.value = data,firstPromise.status =RESOLVED,并执行firstPromise.onResolvedCallbacks.forEach(fn=>fn()),由于onResolvedCallbacks为空，所以相当于未执行

    3.执行firstPromise.then(onfullfilled),then方法中创建新的promise---nextPromise,nextPromise设置好各种初始状态,nextPromise.status=PENDING,此时执行nextPromise的executor
    
    由于firstPromise.status == RESOLVED,所以将onfullfilled(this.value)包裹在一个setTimeout中并执行setTimeout,将onfullfilled放在当前栈之后执行

    firstPromise.then返回nextPromise

    执行nextPromise.then(onfullfilled),then方法中创建新的promise---nextPromise2,nextPromise2设置好各种初始状态,nextPromise2.status=PENDING,此时执行nextPromise2的executor

    在nextPromise2的executor中,由于nextPromise.status == PENDING(因为nextPromise是在firstPromise.then中new出来的,所以在nextPromise的executor中只是执行firstPromise.then(onfullfilled)中包裹着onfullfilled的setTimeout,而没有调用resolve对nextPromise.status做出改变),所以在当前正在执行的nextPromise.then方法中执行nextPromise.onRejectedCallbacks.push(onfullfilled)进行nextPromise.then(onfullfilled)中的onfullfilled订阅

    返回nextPromise2

    执行执行nextPromise2.then(onfullfilled),then方法中创建新的promise---nextPromise3,nextPromise3设置好各种初始状态,nextPromise3.status=PENDING,此时执行nextPromise3的executor

    在nextPromise3的executor中,由于nextPromise2.status == PENDING(因为nextPromise2是在nextPromise.then中new出来的,所以在nextPromise2的executor中只是进行订阅而没有调用resolve对nextPromise2.status做出改变),所以在nextPromise2.then中执行nextPromise2.onRejectedCallbacks.push(onfullfilled)进行nextPromise2.then(onfullfilled)中的onfullfilled订阅



    关键点总结:
        1.then(onfullfilled)中进行对onfullfilled的处理是在新创建的promise的executor中进行的,处理过程依赖then的主体的this.status和this.value
        2.如果promise的executor为异步则之后执行的该promise的then方法中由于当前pormise.status为PENDING,所以只进行订阅,而其他情况则为onfullfilled被包裹在setTimeout等待当前栈执行完毕后再直接执行,此两种情况都会导致后面的then方法优先依次执行
        3.同步和异步只在firstPromise的executor有区别，之后then中重新new的promise的executor都未对当前promise进行status的更改，所以后面的then全部处理为status==PENDING的情况只进行订阅而不是放在setTimeout的宏任务中待执行
        
测试是否符合Promise/A+标准  : promises-aplus-tests promise.js(promise文件)
作者测试环境:node v10.16.0
