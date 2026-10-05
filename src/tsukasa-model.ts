import { CubismUserModel } from '../Framework/src/model/cubismusermodel';
import { CubismModelSettingJson } from '../Framework/src/cubismmodelsettingjson';
import { CubismPhysics } from '../Framework/src/physics/cubismphysics';
import { CubismMotion } from '../Framework/src/motion/cubismmotion';
import { CubismMotionManager } from '../Framework/src/motion/cubismmotionmanager';

export class TsukasaModel extends CubismUserModel {
  private _modelSetting: CubismModelSettingJson | null = null;

  private _openingMotionManager =
    new CubismMotionManager();

  private _openingMotion: CubismMotion | null = null;

  private _openingFinished = false;

  private _specialMotionManager =
    new CubismMotionManager();

  private _specialMotions:
    Map<string, CubismMotion> = new Map();

  public async loadModelSetting(): Promise<void> {
    const response = await fetch(
      '/live2dtest/jewel/jewel.model3.json'
    );

    if (!response.ok) {
      throw new Error(
        `モデル設定の読み込みに失敗しました: ${response.status}`
      );
    }

    const buffer =
      await response.arrayBuffer();

    this._modelSetting =
      new CubismModelSettingJson(
        buffer,
        buffer.byteLength
      );

    console.log(
      'model3.json loaded:',
      this._modelSetting.getModelFileName()
    );
  }

  public async loadPhysics(): Promise<void> {
    const response = await fetch(
      '/live2dtest/jewel/jewel.physics3.json'
    );

    if (!response.ok) {
      throw new Error(
        `物理演算設定の読み込みに失敗しました: ${response.status}`
      );
    }

    const buffer =
      await response.arrayBuffer();

    this._physics =
      CubismPhysics.create(
        buffer,
        buffer.byteLength
      );

    console.log('Physics loaded!');
  }

  public updatePhysics(
    deltaTime: number
  ): void {
    this._physics.evaluate(
      this.getModel(),
      deltaTime
    );
  }

  public async loadModel(): Promise<void> {
    if (!this._modelSetting) {
      throw new Error(
        '先にloadModelSetting()を実行してください'
      );
    }

    const mocFileName =
      this._modelSetting.getModelFileName();

    const response = await fetch(
      `/live2dtest/jewel/${mocFileName}`
    );

    console.log(
      'MOC3 URL:',
      response.url
    );

    console.log(
      'MOC3 content-type:',
      response.headers.get('content-type')
    );

    if (!response.ok) {
      throw new Error(
        `MOC3の読み込みに失敗しました: ${response.status}`
      );
    }

    const buffer =
      await response.arrayBuffer();

    console.log(
      'MOC3 header:',
      JSON.stringify(
        Array.from(
          new Uint8Array(
            buffer.slice(0, 16)
          )
        )
      )
    );

    console.log(
      'MOC3 buffer size:',
      buffer.byteLength
    );

    super.loadModel(
      buffer,
      true
    );

    console.log(
      'MOC:',
      this._moc
    );

    console.log(
      'MODEL:',
      this.getModel()
    );

    console.log(
      'Tsukasa model loaded!',
      this.getModel()
    );
  }

  public async loadTexture(
    gl: WebGLRenderingContext,
    texturePath: string
  ): Promise<WebGLTexture> {
    const image = new Image();

    image.src = texturePath;

    await new Promise<void>(
      (resolve, reject) => {
        image.onload = () => resolve();

        image.onerror = () =>
          reject(
            new Error(
              `テクスチャの読み込みに失敗しました: ${texturePath}`
            )
          );
      }
    );

    const texture =
      gl.createTexture();

    if (!texture) {
      throw new Error(
        'WebGLテクスチャの作成に失敗しました'
      );
    }

    gl.pixelStorei(
      gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
      true
    );

    gl.bindTexture(
      gl.TEXTURE_2D,
      texture
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      gl.LINEAR
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.CLAMP_TO_EDGE
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE
    );

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    gl.bindTexture(
      gl.TEXTURE_2D,
      null
    );

    console.log(
      'Texture loaded:',
      texturePath
    );

    return texture;
  }

  public getTextureCount(): number {
    return (
      this._modelSetting?.getTextureCount() ??
      0
    );
  }

  public getTextureFileName(
    index: number
  ): string {
    if (!this._modelSetting) {
      throw new Error(
        '先にloadModelSetting()を実行してください'
      );
    }

    return this._modelSetting
      .getTextureFileName(index);
  }

  public async loadOpeningMotion(): Promise<void> {
    const response = await fetch(
      '/live2dtest/jewel/jewel_op.motion3.json'
    );

    if (!response.ok) {
      throw new Error(
        `OPモーションの読み込みに失敗しました: ${response.status}`
      );
    }

    const buffer =
      await response.arrayBuffer();

    this._openingMotion =
      CubismMotion.create(
        buffer,
        buffer.byteLength,
        () => {
          console.log(
            'OPモーション終了！'
          );

          this._openingFinished = true;
        }
      );

    if (!this._openingMotion) {
      throw new Error(
        'OPモーションの作成に失敗しました'
      );
    }

    this._openingMotion.setFadeInTime(
      0
    );

    this._openingMotion.setFadeOutTime(
      1.0
    );

    this._openingMotion.setEffectIds(
      [],
      []
    );

    console.log(
      'OPモーション読み込み完了！'
    );
  }

  public async loadSpecialMotions(): Promise<void> {
    const motionFiles = {
      akubi: 'jewel_akubi.motion3.json',
      sing: 'jewel_sing.motion3.json',
      tyou: 'jewel_tyou.motion3.json',
      wind: 'jewel_wind.motion3.json',
    };

    for (
      const [name, fileName]
      of Object.entries(motionFiles)
    ) {
      const response = await fetch(
        `/live2dtest/jewel/${fileName}`
      );

      if (!response.ok) {
        throw new Error(
          `特殊モーションの読み込みに失敗しました: ${response.status} ${fileName}`
        );
      }

      const buffer =
        await response.arrayBuffer();

      const motion = CubismMotion.create(
        buffer,
        buffer.byteLength
      );

      if (!motion) {
        throw new Error(
          `特殊モーションの作成に失敗しました: ${fileName}`
        );
      }

      motion.setFadeInTime(
        0.5
      );

      motion.setFadeOutTime(
        1.0
      );

      motion.setEffectIds(
        [],
        []
      );

      this._specialMotions.set(
        name,
        motion
      );

      console.log(
        `特殊モーション読み込み完了: ${name}`
      );
    }
  }

  public startOpeningMotion(): void {
    if (!this._openingMotion) {
      throw new Error(
        '先にloadOpeningMotion()を実行してください'
      );
    }

    this._openingFinished = false;

    this._openingMotionManager
      .startMotionPriority(
        this._openingMotion,
        false,
        3
      );

    console.log(
      'OPモーション開始！'
    );
  }

  public updateMotion(
    deltaTime: number
  ): void {
    this._openingMotionManager.updateMotion(
      this.getModel(),
      deltaTime
    );
  }

  public isOpeningFinished(): boolean {
    return this._openingMotionManager.isFinished();
  }

  public startSpecialMotion(
    name: string
  ): boolean {
    const motion =
      this._specialMotions.get(name);

    if (!motion) {
      console.error(
        `特殊モーションが見つかりません: ${name}`
      );

      return false;
    }

    this._specialMotionManager
      .startMotionPriority(
        motion,
        false,
        2
      );

    console.log(
      `特殊モーション開始: ${name}`
    );

    return true;
  }

  public updateSpecialMotion(
    deltaTime: number
  ): boolean {
    return this._specialMotionManager.updateMotion(
      this.getModel(),
      deltaTime
    );
  }

  public isSpecialMotionFinished(): boolean {
    return this._specialMotionManager.isFinished();
  }
}