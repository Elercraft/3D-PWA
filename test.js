
var CubePosition, goal
var tween, tweenBack, tweenTurn


var scene, camera, renderer, cube

$(document).ready(() => {


    class SQUARE {
        constructor() {
            const squareGeo = new THREE.BoxGeometry(4, 4, 4)
            const squareMat = new THREE.MeshStandardMaterial({
                roughness: 0.3, // 粗糙度
                metalness: 0.8, // 金屬感
                side: THREE.DoubleSide, // 雙面材質
            })
        }
    }

    //Three.js初始設定
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
        camera.position.set(30, 30, 30)
        camera.lookAt(scene.position)

        // 建立光源
        let pointLight = new THREE.PointLight(0xffffff)
        pointLight.position.set(10, 10, -10)
        scene.add(pointLight)
        let pointlight2 = new THREE.PointLight(0xffffff)
        pointlight2.position.set(10, -10, 10)
        scene.add(pointlight2)

        // 簡單的地板
        const planeGeometry = new THREE.PlaneGeometry(60, 60)
        const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        plane = new THREE.Mesh(planeGeometry, planeMaterial)
        plane.rotation.x = -0.5 * Math.PI
        plane.position.set(0, -1.5, 0)
        plane.receiveShadow = true //地板接收陰影
        scene.add(plane)

        //方塊
        const cubeGeo = new THREE.BoxGeometry(3, 3, 3)
        const cubeMat = new THREE.MeshStandardMaterial({
            roughness: 0.3, // 粗糙度
            metalness: 0.8, // 金屬感
            side: THREE.DoubleSide, // 雙面材質
        })
        cube = new THREE.Mesh(cubeGeo, cubeMat)
        cube.position.set(0, 0, 0)
        scene.add(cube)

        // 建立 OrbitControls
        control = new THREE.OrbitControls(camera, renderer.domElement)
        control.enableDamping = true // 啟用阻尼效果
        control.dampingFactor = 0.25 // 阻尼系數
        control.autoRotate = false // 自動旋轉
    }
    init()

    function AimingCamera() {
        goal = {
            x: (Math.abs(camera.position.x) > 20) ? Math.sign(camera.position.x) * 20 : camera.position.x,
            z: (Math.abs(camera.position.z) > 20) ? Math.sign(camera.position.z) * 20 : camera.position.z
        }
        return goal
    }

    function LocateCube() {
        CubePosition = {
            x: cube.position.x,
            z: cube.position.z
        }
        return CubePosition
    }

    var target = AimingCamera()
    var offset = LocateCube()
    var turnTarget = {
        rotation: Math.PI / 2
    }
    var turnOffset = {
        rotation: 0
    }

    const update = () => {
        cube.position.x = offset.x
        cube.position.z = offset.z
    }

    const updateTurn = () => {
        cube.rotation.y = turnOffset.rotation
    }

    tween = new TWEEN.Tween(offset)
        .to(target, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(update)
        .onComplete(() => {
            tweenBack.start()
        })
        .start()

    tweenBack = new TWEEN.Tween(offset)
        .to({ x: 0, z: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(update)
        .onComplete(() => {


            tweenTurn.start()
        })

    tweenTurn = new TWEEN.Tween(turnOffset)
        .to(turnTarget, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(updateTurn)
        .onComplete(() => {
            //更新tween的target
            target = AimingCamera()
            tween.to(target, 1000)

            console.log(turnOffset.rotation, turnTarget.rotation)

            tween.start()

            //更新tweenTurn的turnTarget
            turnTarget.rotation += Math.PI / 2
            tweenTurn.to(turnTarget, 1000)
        })

    function render() {
        requestAnimationFrame(render)

        TWEEN.update()

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