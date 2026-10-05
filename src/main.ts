import './style.css';

import { CubismFramework } from '../Framework/src/live2dcubismframework';
import { CubismShaderManager_WebGL } from '../Framework/src/rendering/cubismshader_webgl';
import { CubismMatrix44 } from '../Framework/src/math/cubismmatrix44';
import { TsukasaModel } from './tsukasa-model';

console.log('MAIN.TS 動いてる！');

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="live2d" width="2400" height="1800"></canvas>
`;

const canvas =
  document.querySelector<HTMLCanvasElement>('#live2d')!;

const gl = canvas.getContext('webgl2', {
  antialias: true,
  alpha: true,
});

if (!gl) {
  throw new Error(
    'WebGLコンテキストの取得に失敗しました'
  );
}

CubismFramework.startUp();
CubismFramework.initialize();

const model = new TsukasaModel();

model
  .loadModelSetting()
  .then(() => model.loadModel())
  .then(() => model.loadPhysics())
  .then(() => model.loadOpeningMotion())
  .then(() => model.loadSpecialMotions())
  .then(async () => {
    const live2dModel =
      model.getModel();

    // =========================
    // Renderer
    // =========================

    model.createRenderer(
      2400,
      1800
    );

    model
      .getRenderer()
      .startUp(gl);

    model
      .getRenderer()
      .setClippingMaskBufferSize(
        1024
      );

    // =========================
    // シェーダー
    // =========================

    await CubismShaderManager_WebGL
      .getInstance()
      .getShader(gl)
      .generateShaders();

    // =========================
    // テクスチャ
    // =========================

    const textureCount =
      model.getTextureCount();

    for (
      let i = 0;
      i < textureCount;
      i++
    ) {
      const textureFileName =
        model.getTextureFileName(i);

      if (!textureFileName) {
        continue;
      }

      const texture =
        await model.loadTexture(
          gl,
          `/jewel/jewel/${textureFileName}`
        );

      model
        .getRenderer()
        .bindTexture(
          i,
          texture
        );
    }

    // =========================
    // モデルの表示位置・大きさ
    // =========================

    const mvpMatrix =
      new CubismMatrix44();

    mvpMatrix.scaleRelative(
      1.5,
      2.0
    );

    model
      .getRenderer()
      .setMvpMatrix(
        mvpMatrix
      );

    console.log(
      'Live2Dモデルの準備完了！'
    );

    // OP開始まで非表示
    canvas.style.opacity = '0';

    // =========================
    // パラメータ取得
    // =========================

    const idManager =
      CubismFramework.getIdManager();

    const angleXId =
      idManager.getId(
        'ParamAngleX'
      );

    const angleYId =
      idManager.getId(
        'ParamAngleY'
      );

    const angleZId =
      idManager.getId(
        'ParamAngleZ'
      );

    const eyeBallXId =
      idManager.getId(
        'ParamEyeBallX'
      );

    const eyeBallYId =
      idManager.getId(
        'ParamEyeBallY'
      );

    const eyeLOpenId =
      idManager.getId(
        'ParamEyeLOpen'
      );

    const eyeROpenId =
      idManager.getId(
        'ParamEyeROpen'
      );

    const breathId =
      idManager.getId(
        'ParamBreath'
      );

    // =========================
    // パラメータIndex
    // =========================

    const angleXIndex =
      live2dModel.getParameterIndex(
        angleXId
      );

    const angleYIndex =
      live2dModel.getParameterIndex(
        angleYId
      );

    const angleZIndex =
      live2dModel.getParameterIndex(
        angleZId
      );

    const eyeBallXIndex =
      live2dModel.getParameterIndex(
        eyeBallXId
      );

    const eyeBallYIndex =
      live2dModel.getParameterIndex(
        eyeBallYId
      );

    const eyeLOpenIndex =
      live2dModel.getParameterIndex(
        eyeLOpenId
      );

    const eyeROpenIndex =
      live2dModel.getParameterIndex(
        eyeROpenId
      );

    const breathIndex =
      live2dModel.getParameterIndex(
        breathId
      );

    // =========================
    // 初期値
    // =========================

    const baseAngleX =
      angleXIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            angleXIndex
          )
        : 0;

    const baseAngleY =
      angleYIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            angleYIndex
          )
        : 0;

    const baseAngleZ =
      angleZIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            angleZIndex
          )
        : 0;

    const baseEyeBallX =
      eyeBallXIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            eyeBallXIndex
          )
        : 0;

    const baseEyeBallY =
      eyeBallYIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            eyeBallYIndex
          )
        : 0;

    const baseEyeLOpen =
      eyeLOpenIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            eyeLOpenIndex
          )
        : 1;

    const baseEyeROpen =
      eyeROpenIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            eyeROpenIndex
          )
        : 1;

    const baseBreath =
      breathIndex >= 0
        ? live2dModel.getParameterValueByIndex(
            breathIndex
          )
        : 0;

    // =========================
    // マウス操作
    // =========================

    let isDragging = false;

    let mouseX = 0;
    let mouseY = 0;

    let smoothMouseX = 0;
let smoothMouseY = 0;

const mouseReturnSpeed = 3;

    canvas.addEventListener(
      'pointerdown',
      (event) => {
        isDragging = true;

        canvas.setPointerCapture(
          event.pointerId
        );
      }
    );

    canvas.addEventListener(
      'pointermove',
      (event) => {
        if (!isDragging) {
          return;
        }

        const rect =
          canvas.getBoundingClientRect();

        mouseX =
          ((event.clientX -
            rect.left) /
            rect.width) *
            2 -
          1;

        mouseY =
          ((event.clientY -
            rect.top) /
            rect.height) *
            2 -
          1;
      }
    );

    canvas.addEventListener(
      'pointerup',
      () => {
        isDragging = false;
      }
    );

    canvas.addEventListener(
      'pointercancel',
      () => {
        isDragging = false;
      }
    );

    // =========================
    // 自動モーション用
    // =========================

    let blinkTimer = 0;

    let nextBlinkTime =
      4.5 +
      Math.random() * 4.0;

    let blinkProgress = 0;

    let isBlinking = false;

    let breathTime = 0;

    // =========================
    // OP → 通常待機 移行用
    // =========================

    let idleTransitionStarted =
      false;

    let idleTransitionTime =
      0;

    const idleTransitionDuration =
      0.7;

    let transitionAngleX =
      baseAngleX;

    let transitionAngleY =
      baseAngleY;

    let transitionAngleZ =
      baseAngleZ;

    let transitionEyeBallX =
      baseEyeBallX;

    let transitionEyeBallY =
      baseEyeBallY;

    let transitionEyeLOpen =
      baseEyeLOpen;

    let transitionEyeROpen =
      baseEyeROpen;

    // =========================
    // 特殊モーション用
    // =========================

    let butterflyPlayed =
      false;

    let specialMotionCount =
      0;

    let specialMotionPlaying =
      false;

    let specialMotionStarted =
      false;

    let specialMotionWaitTime =
      0;

    // 特殊モーション終了後の移行
    let specialTransitionStarted =
      false;

    let specialTransitionTime =
      0;

    const specialTransitionDuration =
      0.7;

    let specialTransitionAngleX =
      baseAngleX;

    let specialTransitionAngleY =
      baseAngleY;

    let specialTransitionAngleZ =
      baseAngleZ;

    let specialTransitionEyeBallX =
      baseEyeBallX;

    let specialTransitionEyeBallY =
      baseEyeBallY;

    let specialTransitionEyeLOpen =
      baseEyeLOpen;

    let specialTransitionEyeROpen =
      baseEyeROpen;

    let nextSpecialMotionTime =
      12 +
      Math.random() * 10;

    // =========================
    // 時間
    // =========================

    let lastTime =
      performance.now();

    // =========================
    // OP開始
    // =========================

    model.startOpeningMotion();

    canvas.style.opacity = '1';

    // =========================
    // 描画ループ
    // =========================

    const draw = (
      currentTime: number
    ) => {
      let deltaTime =
        (currentTime -
          lastTime) /
        1000;

      lastTime =
        currentTime;

      deltaTime =
        Math.min(
          deltaTime,
          0.1
        );

      // =========================
      // 画面クリア
      // =========================

      gl.clearColor(
        0,
        0,
        0,
        0
      );

      gl.clear(
        gl.COLOR_BUFFER_BIT
      );

      // =========================
      // 物理演算
      // =========================

      model.updatePhysics(
        deltaTime
      );

      // =========================
      // OPモーション
      // =========================

      const openingFinished =
        model.isOpeningFinished();

      if (!openingFinished) {
        // OP再生中
        model.updateMotion(
          deltaTime
        );
      } else {
        // =========================
        // OP → 通常待機
        // =========================

        if (
          !idleTransitionStarted
        ) {
          idleTransitionStarted =
            true;

          idleTransitionTime =
            0;

          transitionAngleX =
            angleXIndex >= 0
              ? live2dModel.getParameterValueByIndex(
                  angleXIndex
                )
              : baseAngleX;

          transitionAngleY =
            angleYIndex >= 0
              ? live2dModel.getParameterValueByIndex(
                  angleYIndex
                )
              : baseAngleY;

          transitionAngleZ =
            angleZIndex >= 0
              ? live2dModel.getParameterValueByIndex(
                  angleZIndex
                )
              : baseAngleZ;

          transitionEyeBallX =
            eyeBallXIndex >= 0
              ? live2dModel.getParameterValueByIndex(
                  eyeBallXIndex
                )
              : baseEyeBallX;

          transitionEyeBallY =
            eyeBallYIndex >= 0
              ? live2dModel.getParameterValueByIndex(
                  eyeBallYIndex
                )
              : baseEyeBallY;

          transitionEyeLOpen =
            eyeLOpenIndex >= 0
              ? live2dModel.getParameterValueByIndex(
                  eyeLOpenIndex
                )
              : baseEyeLOpen;

          transitionEyeROpen =
            eyeROpenIndex >= 0
              ? live2dModel.getParameterValueByIndex(
                  eyeROpenIndex
                )
              : baseEyeROpen;
        }

        // =========================
        // 特殊モーション開始準備
        // =========================

        if (
          !specialMotionStarted
        ) {
          specialMotionStarted =
            true;

          specialMotionWaitTime =
            0;

          nextSpecialMotionTime =
            12 +
            Math.random() * 10;
        }

        // =========================
        // 特殊モーション待機
        // =========================

        if (
          !specialMotionPlaying &&
          !specialTransitionStarted &&
          idleTransitionTime >=
            idleTransitionDuration
        ) {
          specialMotionWaitTime +=
            deltaTime;

          if (
            specialMotionWaitTime >=
            nextSpecialMotionTime
          ) {
            let selectedMotion: string;

            // =========================
            // 蝶を一度だけ発生
            // =========================

            if (
              !butterflyPlayed &&
              specialMotionCount >= 3
            ) {
              selectedMotion =
                'tyou';

              butterflyPlayed =
                true;

              console.log(
                '蝶'
              );
            } else {
              // =========================
              // 通常モーション抽選
              // =========================

              const randomValue =
                Math.random();

              if (
                randomValue < 0.5
              ) {
                selectedMotion =
                  'akubi';
              } else if (
                randomValue < 0.95
              ) {
                selectedMotion =
                  'wind';
              } else {
                selectedMotion =
                  'sing';
              }
            }

            console.log(
              '特殊モーション開始:',
              selectedMotion
            );

            model.startSpecialMotion(
              selectedMotion
            );

            specialMotionPlaying =
              true;

            specialMotionWaitTime =
              0;

            specialMotionCount++;
          }
        }

        // =========================
        // 特殊モーション再生
        // =========================

        if (
          specialMotionPlaying
        ) {
          model.updateSpecialMotion(
            deltaTime
          );

          if (
            model.isSpecialMotionFinished()
          ) {
            // =========================
            // 特殊モーション終了後の移行
            // =========================

            specialTransitionStarted =
              true;

            specialTransitionTime =
              0;

            specialTransitionAngleX =
              angleXIndex >= 0
                ? live2dModel.getParameterValueByIndex(
                    angleXIndex
                  )
                : baseAngleX;

            specialTransitionAngleY =
              angleYIndex >= 0
                ? live2dModel.getParameterValueByIndex(
                    angleYIndex
                  )
                : baseAngleY;

            specialTransitionAngleZ =
              angleZIndex >= 0
                ? live2dModel.getParameterValueByIndex(
                    angleZIndex
                  )
                : baseAngleZ;

            specialTransitionEyeBallX =
              eyeBallXIndex >= 0
                ? live2dModel.getParameterValueByIndex(
                    eyeBallXIndex
                  )
                : baseEyeBallX;

            specialTransitionEyeBallY =
              eyeBallYIndex >= 0
                ? live2dModel.getParameterValueByIndex(
                    eyeBallYIndex
                  )
                : baseEyeBallY;

            specialTransitionEyeLOpen =
              eyeLOpenIndex >= 0
                ? live2dModel.getParameterValueByIndex(
                    eyeLOpenIndex
                  )
                : baseEyeLOpen;

            specialTransitionEyeROpen =
              eyeROpenIndex >= 0
                ? live2dModel.getParameterValueByIndex(
                    eyeROpenIndex
                  )
                : baseEyeROpen;

            specialMotionPlaying =
              false;

            specialMotionWaitTime =
              0;

            nextSpecialMotionTime =
              12 +
              Math.random() * 10;
          }
        }

        // =========================
        // 通常待機
        // =========================

        if (
          !specialMotionPlaying
        ) {
          // =========================
          // 特殊モーション → 通常待機
          // =========================

          // =========================
          // 遷移中も呼吸を続ける
          // =========================

          if (
            specialTransitionStarted &&
            breathIndex >= 0
          ) {
            breathTime +=
              deltaTime;

            const breathValue =
              Math.sin(
                breathTime * 1.5
              ) *
                0.5 +
              0.5;

            live2dModel.setParameterValueByIndex(
              breathIndex,
              baseBreath +
                breathValue
            );
          }

          if (
            specialTransitionStarted
          ) {
            specialTransitionTime +=
              deltaTime;

            const rawProgress =
              Math.min(
                specialTransitionTime /
                  specialTransitionDuration,
                1
              );

            const progress =
              rawProgress *
              rawProgress *
              (3 -
                2 *
                  rawProgress);

            if (angleXIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                angleXIndex,
                specialTransitionAngleX +
                  (baseAngleX -
                    specialTransitionAngleX) *
                    progress
              );
            }

            if (angleYIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                angleYIndex,
                specialTransitionAngleY +
                  (baseAngleY -
                    specialTransitionAngleY) *
                    progress
              );
            }

            if (angleZIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                angleZIndex,
                specialTransitionAngleZ +
                  (baseAngleZ -
                    specialTransitionAngleZ) *
                    progress
              );
            }

            if (eyeBallXIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeBallXIndex,
                specialTransitionEyeBallX +
                  (baseEyeBallX -
                    specialTransitionEyeBallX) *
                    progress
              );
            }

            if (eyeBallYIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeBallYIndex,
                specialTransitionEyeBallY +
                  (baseEyeBallY -
                    specialTransitionEyeBallY) *
                    progress
              );
            }

            if (eyeLOpenIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeLOpenIndex,
                specialTransitionEyeLOpen +
                  (baseEyeLOpen -
                    specialTransitionEyeLOpen) *
                    progress
              );
            }

            if (eyeROpenIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeROpenIndex,
                specialTransitionEyeROpen +
                  (baseEyeROpen -
                    specialTransitionEyeROpen) *
                    progress
              );
            }

            if (
              specialTransitionTime >=
              specialTransitionDuration
            ) {
              specialTransitionStarted =
                false;
            }
          }

          // =========================
          // OP → 通常待機
          // =========================

          if (
            !specialTransitionStarted &&
            idleTransitionTime <
              idleTransitionDuration
          ) {
            idleTransitionTime +=
              deltaTime;

            const rawProgress =
              Math.min(
                idleTransitionTime /
                  idleTransitionDuration,
                1
              );

            const progress =
              rawProgress *
              rawProgress *
              (3 -
                2 *
                  rawProgress);

            if (angleXIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                angleXIndex,
                transitionAngleX +
                  (baseAngleX -
                    transitionAngleX) *
                    progress
              );
            }

            if (angleYIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                angleYIndex,
                transitionAngleY +
                  (baseAngleY -
                    transitionAngleY) *
                    progress
              );
            }

            if (angleZIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                angleZIndex,
                transitionAngleZ +
                  (baseAngleZ -
                    transitionAngleZ) *
                    progress
              );
            }

            if (eyeBallXIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeBallXIndex,
                transitionEyeBallX +
                  (baseEyeBallX -
                    transitionEyeBallX) *
                    progress
              );
            }

            if (eyeBallYIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeBallYIndex,
                transitionEyeBallY +
                  (baseEyeBallY -
                    transitionEyeBallY) *
                    progress
              );
            }

            if (eyeLOpenIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeLOpenIndex,
                transitionEyeLOpen +
                  (baseEyeLOpen -
                    transitionEyeLOpen) *
                    progress
              );
            }

            if (eyeROpenIndex >= 0) {
              live2dModel.setParameterValueByIndex(
                eyeROpenIndex,
                transitionEyeROpen +
                  (baseEyeROpen -
                    transitionEyeROpen) *
                    progress
              );
            }
          }

          // =========================
          // 通常待機中の操作
          // =========================

          if (
            !specialTransitionStarted &&
            idleTransitionTime >=
              idleTransitionDuration
          ) {
            // =========================
            // 顔・目の追従
            // =========================

            const targetMouseX =
  isDragging ? mouseX : 0;

const targetMouseY =
  isDragging ? mouseY : 0;

const mouseSmooth =
  Math.min(
    deltaTime * mouseReturnSpeed,
    1
  );

smoothMouseX +=
  (targetMouseX - smoothMouseX) *
  mouseSmooth;

smoothMouseY +=
  (targetMouseY - smoothMouseY) *
  mouseSmooth;

if (angleXIndex >= 0) {
  live2dModel.setParameterValueByIndex(
    angleXIndex,
    baseAngleX +
      smoothMouseX * 30
  );
}

if (angleYIndex >= 0) {
  live2dModel.setParameterValueByIndex(
    angleYIndex,
    baseAngleY -
      smoothMouseY * 20
  );
}

if (angleZIndex >= 0) {
  live2dModel.setParameterValueByIndex(
    angleZIndex,
    baseAngleZ +
      smoothMouseX * 15
  );
}

if (eyeBallXIndex >= 0) {
  live2dModel.setParameterValueByIndex(
    eyeBallXIndex,
    baseEyeBallX +
      smoothMouseX
  );
}

if (eyeBallYIndex >= 0) {
  live2dModel.setParameterValueByIndex(
    eyeBallYIndex,
    baseEyeBallY -
      smoothMouseY
  );
}

            // =========================
            // まばたき
            // =========================

            blinkTimer +=
              deltaTime;

            if (
              !isBlinking &&
              blinkTimer >=
                nextBlinkTime
            ) {
              isBlinking =
                true;

              blinkProgress =
                0;

              blinkTimer =
                0;
            }

            if (isBlinking) {
              blinkProgress +=
                deltaTime /
                0.45;

              if (
                blinkProgress >=
                1
              ) {
                blinkProgress =
                  1;

                isBlinking =
                  false;

                nextBlinkTime =
                  4.5 +
                  Math.random() *
                    4.0;
              }

              const blinkValue =
                blinkProgress <
                0.5
                  ? blinkProgress * 2
                  : (1 -
                      blinkProgress) *
                      2;

              const eyeOpenValue =
                1 -
                blinkValue;

              if (
                eyeLOpenIndex >= 0
              ) {
                live2dModel.setParameterValueByIndex(
                  eyeLOpenIndex,
                  eyeOpenValue
                );
              }

              if (
                eyeROpenIndex >= 0
              ) {
                live2dModel.setParameterValueByIndex(
                  eyeROpenIndex,
                  eyeOpenValue
                );
              }
            } else {
              if (
                eyeLOpenIndex >= 0
              ) {
                live2dModel.setParameterValueByIndex(
                  eyeLOpenIndex,
                  baseEyeLOpen
                );
              }

              if (
                eyeROpenIndex >= 0
              ) {
                live2dModel.setParameterValueByIndex(
                  eyeROpenIndex,
                  baseEyeROpen
                );
              }
            }
          }
        }
      }

      // =========================
      // モデル更新
      // =========================

      live2dModel.update();

      // =========================
      // 描画
      // =========================

      model
        .getRenderer()
        .drawModel();

      requestAnimationFrame(
        draw
      );
    };

    requestAnimationFrame(
      draw
    );
  })
  .catch((error) => {
    console.error(
      'モデル読み込みエラー:',
      error
    );
  });