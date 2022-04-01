import React, { useRef, useEffect } from 'react';
import styles from './index.module.scss';
import {
  ClampToEdgeWrapping, LinearFilter, Mesh, OrthographicCamera, PlaneBufferGeometry,
  Scene, ShaderMaterial, Texture, TextureLoader, Vector2, WebGLRenderer
} from 'three';

const clamp = (value: number, min: number, max: number) => {
  return value > max
    ? max
    : value < min
      ? min
      : value;
}

export const App = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) { return }
    const container = ref.current;
    const renderer = new WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.append(renderer.domElement);

    const onWindowResize = () => {
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize);
    const uMouse = new Vector2();
    const mouseTarget = new Vector2();
    const move = (e: MouseEvent) => {
      const target = e.target as HTMLDivElement;
      const { offsetWidth, offsetHeight } = target;
      const hwidth = offsetWidth / 2;
      const hheight = offsetHeight / 2;
      const limit = 15;
      const x = clamp(hwidth - e.clientX, -limit, limit);
      const y = clamp(hheight - e.clientY, -limit, limit);
      mouseTarget.setX(x / hwidth);
      mouseTarget.setY(y / hheight);
    }
    container.addEventListener('mousemove', move);

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new Scene();
    const geometry = new PlaneBufferGeometry(2, 2);
    const texture1 = new Texture();
    const texture2 = new Texture();
    const params = {
      uniforms: {
        texture1: { value: texture1 },
        texture2: { value: texture2 },
        uMouse: { value: uMouse },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  gl_Position = vec4(position, 1.0); ",
        "}",
      ].join('\n'),
      fragmentShader: [
        "uniform sampler2D texture1;",
        "uniform sampler2D texture2;",
        "uniform vec2 uMouse;",
        "varying vec2 vUv;",
        'void main(){',
        "vec2 posUV = vec2(0.5) + (vUv - vec2(0.5)) * 0.95;",
        "vec4 depth = texture2D(texture1, posUV);",
        ' gl_FragColor = texture2D(texture2, posUV+uMouse*depth.r/2.);',
        '}',
      ].join('\n'),
    }
    const material = new ShaderMaterial(params);
    const board = new Mesh(geometry, material);
    const textureLoader = new TextureLoader();
    textureLoader.loadAsync('001_depth.png')
      .then(map => {
        map.wrapS = ClampToEdgeWrapping;
        map.wrapT = ClampToEdgeWrapping;
        map.minFilter = LinearFilter;
        map.magFilter = LinearFilter;
        texture1.copy(map);
        texture1.needsUpdate = true;
      })
      .catch(error => console.log(error));
    textureLoader.loadAsync('001.png')
      .then(map => {
        map.wrapS = ClampToEdgeWrapping;
        map.wrapT = ClampToEdgeWrapping;
        map.minFilter = LinearFilter;
        map.magFilter = LinearFilter;
        texture2.copy(map);
        texture2.needsUpdate = true;
      })
      .catch(error => console.log(error));

    scene.add(board);

    let timer: number;
    const draw = () => {
      const x = (mouseTarget.x - uMouse.x) / 20;
      const y = (mouseTarget.y - uMouse.y) / 20;
      uMouse.x += x;
      uMouse.y += y;
      renderer.render(scene, camera);
      timer = requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    return () => cancelAnimationFrame(timer);
  }, [ref])

  return <div
    className={styles.root}
    ref={ref}
  />
}