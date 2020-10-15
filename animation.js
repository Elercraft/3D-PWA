//tween.js 參考 https://github.com/tweenjs/tween.js/blob/master/docs/user_guide.md

var TurnOffset, TurnTarget, TurnBackTarget
var target
$(document).ready(function () {
    let renderer, scene, camera
    let control, stats
    let rotateAngle = 0
    let creeperObj, plane
    let rotateHeadOffset = 0
    let walkOffset = 0
    let scaleHeadOffset = 0
    let invert = 1

    // 苦力帕物件
    class Creeper {
        constructor() {
            // 宣告頭、身體、腳幾何體大小
            const headGeo = new THREE.BoxGeometry(4, 4, 4)
            const bodyGeo = new THREE.BoxGeometry(4, 8, 2)
            const footGeo = new THREE.BoxGeometry(2, 3, 2)

            // 苦力帕臉部貼圖
            const headMap = new THREE.TextureLoader().load(
                'https://dl.dropboxusercontent.com/s/bkqu0tty04epc46/creeper_face.png'
            )
            // 苦力帕皮膚貼圖
            const skinMap = new THREE.TextureLoader().load(
                'https://dl.dropboxusercontent.com/s/eev6wxdxfmukkt8/creeper_skin.png'
            )

            // 身體與腳的材質設定
            const skinMat = new THREE.MeshStandardMaterial({
                roughness: 0.3, // 粗糙度
                metalness: 0.8, // 金屬感
                transparent: true, // 透明與否
                opacity: 0.9, // 透明度
                side: THREE.DoubleSide, // 雙面材質
                map: skinMap // 皮膚貼圖
            })
            // 準備頭部與臉的材質
            const headMaterials = []
            for (let i = 0; i < 6; i++) {
                let map

                if (i === 4) map = headMap
                else map = skinMap

                headMaterials.push(new THREE.MeshStandardMaterial({ map: map }))
            }

            // 頭
            this.head = new THREE.Mesh(headGeo, headMaterials)
            this.head.position.set(0, 6, 0)
            //this.head.rotation.y = Math.PI // 稍微的擺頭

            // 身體
            this.body = new THREE.Mesh(bodyGeo, skinMat)
            this.body.position.set(0, 0, 0)

            // 四隻腳
            this.foot1 = new THREE.Mesh(footGeo, skinMat)
            this.foot1.position.set(-1.1, -5.5, 2)
            this.foot2 = this.foot1.clone() // 剩下三隻腳都複製第一隻的 Mesh
            this.foot2.position.set(-1.1, -5.5, -2)
            this.foot3 = this.foot1.clone()
            this.foot3.position.set(1.1, -5.5, 2)
            this.foot4 = this.foot1.clone()
            this.foot4.position.set(1.1, -5.5, -2)

            // 將四隻腳組合為一個 group
            this.feet = new THREE.Group()
            this.feet.add(this.foot1)
            this.feet.add(this.foot2)
            this.feet.add(this.foot3)
            this.feet.add(this.foot4)

            // 將頭、身體、腳組合為一個 group
            this.creeper = new THREE.Group()
            this.creeper.add(this.head)
            this.creeper.add(this.body)
            this.creeper.add(this.feet)

            // 苦力帕投影設定，利用 traverse 遍歷各個子元件設定陰影
            this.creeper.traverse(function (object) {
                if (object instanceof THREE.Mesh) {
                    object.castShadow = true
                    object.receiveShadow = true
                }
            })
        }
    }

    // 生成苦力帕並加到場景
    function createCreeper() {
        creeperObj = new Creeper()
        scene.add(creeperObj.creeper)
    }

    //開關動畫面板
    let datGUIControls = new function () {
        this.startRotateHead = false
        this.startWalking = false
        this.startScaleBody = false
        //this.startMoving = false
    }

    //性能監測
    function initStats() {
        stats = new Stats()
        stats.setMode(0)    //stats.setMode(0)，這裡如果設成 0 ，會顯示「畫面刷新頻率（FPS）」，設成 1 的話，就會轉換為「畫面渲染時間」。
        document.getElementById('stats').appendChild(stats.domElement)
        return stats
    }
    initStats();

    // 畫面初始化
    function init() {
        scene = new THREE.Scene()

        // 渲染器設定
        renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.shadowMap.enabled = true // 設定需渲染陰影效果
        renderer.shadowMap.type = 2 // THREE.PCFSoftShadowMap 毛邊優化
        document.body.appendChild(renderer.domElement)// 將渲染出來的畫面放到網頁上的 DOM

        // 相機設定
        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        camera.position.set(0, 30, 30)
        camera.lookAt(scene.position)

        // 建立 OrbitControls
        control = new THREE.OrbitControls(camera, renderer.domElement)
        control.enableDamping = true // 啟用阻尼效果
        control.dampingFactor = 0.25 // 阻尼系數
        control.autoRotate = false // 自動旋轉

        // 三軸座標輔助
        let axes = new THREE.AxesHelper(20)
        scene.add(axes)

        // 簡單的地板
        const planeGeometry = new THREE.PlaneGeometry(60, 60)
        const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        plane = new THREE.Mesh(planeGeometry, planeMaterial)
        plane.rotation.x = -0.5 * Math.PI
        plane.position.set(0, -7, 0)
        plane.receiveShadow = true //地板接收陰影
        scene.add(plane)

        // 產生苦力帕物件並加到場景
        createCreeper()

        // 設置聚光燈幫忙照亮物體
        /*let spotLight = new THREE.SpotLight(0xf0f0f0)
        spotLight.position.set(-10, 30, 20)
        spotLight.castShadow = true
        scene.add(spotLight)*/

        // 設置環境光提供輔助柔和白光
        let ambientLight = new THREE.AmbientLight(0x404040, 1)
        scene.add(ambientLight)

        // 點光源
        pointLight = new THREE.PointLight(0xccffcc, 1, 100) // 顏色, 強度, 距離
        pointLight.castShadow = true // 投影
        pointLight.position.set(-30, 30, 30)
        scene.add(pointLight)

        // 小球體模擬點光源實體
        const sphereLightGeo = new THREE.SphereGeometry(0.3)
        const sphereLightMat = new THREE.MeshBasicMaterial({ color: 0xccffcc })
        sphereLightMesh = new THREE.Mesh(sphereLightGeo, sphereLightMat)
        sphereLightMesh.castShadow = true
        sphereLightMesh.position.y = 16
        scene.add(sphereLightMesh)
    }
    init()

    // 點光源繞 Y 軸旋轉動畫
    function pointLightAnimation() {
        if (rotateAngle > 2 * Math.PI) {
            rotateAngle = 0 // 超過 360 度後歸零
        } else {
            rotateAngle += 0.03 // 遞增角度
        }

        // 光源延橢圓軌道繞 Y 軸旋轉
        sphereLightMesh.position.x = 12 * Math.cos(rotateAngle)
        sphereLightMesh.position.z = 10 * Math.sin(rotateAngle)

        // 點光源位置與球體同步
        pointLight.position.copy(sphereLightMesh.position)
    }

    // dat.GUI 控制面板
    gui = new dat.GUI()
    gui.add(datGUIControls, 'startRotateHead')
    gui.add(datGUIControls, 'startWalking')
    gui.add(datGUIControls, 'startScaleBody')
    //gui.add(datGUIControls, 'startMoving')

    // 苦力帕擺頭
    function creeperHeadRotate() {
        rotateHeadOffset += 0.04
        creeperObj.head.rotation.y = Math.sin(rotateHeadOffset)
    }

    // 苦力帕原地走動
    function creeperFeetWalk() {
        walkOffset += 0.04
        creeperObj.foot1.rotation.x = Math.sin(walkOffset) / 4 // 前右腳
        creeperObj.foot2.rotation.x = -Math.sin(walkOffset) / 4 // 後右腳
        creeperObj.foot3.rotation.x = -Math.sin(walkOffset) / 4 // 前左腳
        creeperObj.foot4.rotation.x = Math.sin(walkOffset) / 4 // 後左腳
    }

    // 苦力帕膨脹
    function creeperScaleBody() {
        scaleHeadOffset += 0.04

        let scaleRate = Math.abs(Math.sin(scaleHeadOffset)) / 16 + 1
        creeperObj.creeper.scale.set(scaleRate, scaleRate, scaleRate)
    }

    //定位路徑終點camera的方向
    function AimingCamera() {
        var goal = {
            x: (Math.abs(camera.position.x) > 20) ? Math.sign(camera.position.x) * 20 : camera.position.x,
            z: (Math.abs(camera.position.z) > 20) ? Math.sign(camera.position.z) * 20 : camera.position.z
        }
        return goal
    }

    //計算轉身角度
    function TurnToCamera() {
        var goal = AimingCamera()

        const v1 = new THREE.Vector2(0, 1) // 原點面向方向
        const v2 = new THREE.Vector2(goal.x, goal.z) // 苦力怕面向新相機方向

        // 內積除以純量得兩向量 cos 值
        let cosValue = v1.dot(v2) / (v1.length() * v2.length())

        //當X的值小於0時，內積算出來的角度不會是逆時針的角度
        let angle = (goal.x > 0) ? Math.acos(cosValue) : -Math.acos(cosValue)

        // cos 值求轉身角度
        return angle
    }

    //定位苦力怕
    function LocateCreeper() {
        let location = {
            x: creeperObj.creeper.position.x,
            z: creeperObj.creeper.position.z
        }
        return location
    }

    //定位苦力怕轉頭角度
    function LocateCreeperTurn() {
        return creeperObj.head.rotation.y
    }

    const UpdateMove = () => {
        //移動
        creeperObj.creeper.position.x = offset.x
        creeperObj.creeper.position.z = offset.z
    }

    const UpdateTurn = () => {
        //轉身
        creeperObj.creeper.rotation.y = TurnOffset.deg
    }

    TurnOffset = { deg: LocateCreeperTurn() }
    TurnTarget = { deg: TurnToCamera() }
    TurnBackTarget = { deg: TurnTarget.deg + Math.PI }
    var offset = LocateCreeper()
    target = AimingCamera()

    //轉向camera
    let tweenTurn = new TWEEN.Tween(TurnOffset)
        .to(TurnTarget, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(UpdateTurn)
        .onComplete(() => {
            tween.start()
        })
        .delay(500)     
        .start()

    //往camera移動
    let tween = new TWEEN.Tween(offset)
        .to(target, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(UpdateMove)
        .onComplete(() => {
            tweenTurnBack.start()
        })

    //轉向原點
    let tweenTurnBack = new TWEEN.Tween(TurnOffset)
        .to(TurnBackTarget, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(UpdateTurn)
        .onComplete(() => {
            tweenBack.start()
        })

    //往原點移動
    let tweenBack = new TWEEN.Tween(offset)
        .to({ x: 0, z: 0 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(UpdateMove)
        .onComplete(() => {
            console.log(TurnOffset, TurnTarget, TurnBackTarget)
            //alert("One Cycle")

            //更新tweenTurnBack的TurnBackTarget
            TurnBackTarget.deg = TurnTarget.deg + Math.PI
            tweenTurnBack.to(TurnBackTarget, 500)

            //更新tweenTurn的 TurnTarget 及 TurnOffset
            TurnTarget.deg = TurnToCamera()
            tweenTurn.to(TurnTarget, 500)

            //更新tween的target
            target = AimingCamera()
            tween.to(target, 500)

            tweenTurn.start()
        })

    function render() {
        stats.update()
        control.update()
        pointLightAnimation()

        if (datGUIControls.startRotateHead === true) { creeperHeadRotate() }
        if (datGUIControls.startWalking === true) { creeperFeetWalk() }
        if (datGUIControls.startScaleBody === true) { creeperScaleBody() }

        TWEEN.update()

        requestAnimationFrame(render)
        renderer.render(scene, camera)
    }
    render()

    //讓視窗可以彈性調整大小
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })
})