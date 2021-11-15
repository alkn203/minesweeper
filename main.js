phina.globalize();
// 定数
var SCREEN_WIDTH = 640; // 画面横サイズ
var PANEL_NUM_XY = 9; // 縦横のパネル数
var GRID_SIZE = (SCREEN_WIDTH - 10) / PANEL_NUM_XY; // グリッドのサイズ
var SCREEN_HEIGHT = GRID_SIZE * 11; // 画面縦サイズ
var PANEL_SIZE = GRID_SIZE * 0.9; // パネルの大きさ
var PANEL_OFFSET = (GRID_SIZE + 10) / 2; // オフセット値
var BOMB_NUM = 10; // 爆弾数
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    // 背景色
    this.backgroundColor = 'gray';
    // タッチ不可に
    this.setInteractive(false);
    // グリッド
    var grid = Grid(GRID_SIZE * PANEL_NUM_XY, PANEL_NUM_XY);
    // グループ
    var panelGroup = DisplayElement().addChildTo(this);
    // 爆弾位置をランダムに決めた配列を作成
    var bombs = [];
    (PANEL_NUM_XY * PANEL_NUM_XY).times(function() {
      bombs.push(false);
    });
    bombs.fill(true, 0, 10).shuffle();

    var self = this;
    // ピース配置
    PANEL_NUM_XY.times(function(spanX) {
      PANEL_NUM_XY.times(function(spanY) {
        // パネル作成
        var panel = Panel().addChildTo(panelGroup);
        // Gridを利用して配置
        panel.x = grid.span(spanX) + PANEL_OFFSET;
        panel.y = grid.span(spanY) + PANEL_OFFSET;
        // パネルに爆弾情報を紐づける
        panel.isBomb = bombs[spanX * PANEL_NUM_XY + spanY];
        // パネルタッチ時
        panel.onpointstart = function() {
          // マークモードなら
          if (self.mode === 'mark') {
            if (!panel.isOpen && !panel.isMark) {
              // マーク追加
              if (self.markCount < BOMB_NUM) {
                Mark().addChildTo(panel);
                panel.isMark = true;
                self.markCount++;
              }
            }
            else {
              if (self.markCount > 0) {
                // マーク削除
                panel.children[0].remove();
                panel.isMark = false;
                self.markCount--;
              }
            }
          }
          else {
            // パネルを開く
            self.openPanel(panel);
            // クリア判定
            self.checkClear();
          }
        };
      });
    });
    // モード
    this.mode = 'normal';
    // マークモードボタン
    Button({
      width: 120,
      height: 64,
      text: 'Mark',
      fill: 'silver',
    }).addChildTo(this)
      .setPosition(this.gridX.span(14), this.gridY.span(14.5))
      .onpush = function() {
        // モード変更
        if (self.mode === 'normal') {
          this.fill = 'hsl(160, 80%, 50%)';
          self.mode = 'mark';
        }
        else {
          this.fill = 'silver';
          self.mode = 'normal';
        }
      };
    // 参照用
    this.panelGroup = panelGroup;
    // クリア判定用
    this.oCount = 0;
    // マークの数
    this.markCount = 0;
  },
  // クリア判定
  checkClear: function() {
    if (this.oCount === PANEL_NUM_XY * PANEL_NUM_XY - BOMB_NUM) {
      // ラベル表示
      Label({
        text: 'GOOD JOB!',
        fill: 'white',
      }).addChildTo(this).setPosition(320, 700);
      // パネルを選択不可に
      this.panelGroup.children.each(function(panel) {
        panel.setInteractive(false);
      });
    }
  },
  // 画面タッチ可能な場合
  onpointstart: function() {
    // 再スタート
    this.exit({
      nextLabel: 'main',  
    });  
  },
  // パネルを開く処理
  openPanel: function(panel) {
    // マークされていた何もしない
    if (panel.isMark) return;
    // 爆弾ならゲームオーバー
    if (panel.isBomb) {
      Explosion().addChildTo(panel);
      this.showAllBombs();
      return;
    }
    // 既に開かれていた何もしない
    if (panel.isOpen) return;
    // 開いたとフラグを立てる
    panel.isOpen = true;
    this.oCount++;
    // タッチ不可にする
    panel.setInteractive(false);
    
    var bombs = 0;
    var indexs = [-1, 0, 1];
    var self = this;
    // 周りのパネルの爆弾数をカウント
    indexs.each(function(i) {
      indexs.each(function(j) {
        var pos = Vector2(panel.x + i * GRID_SIZE, panel.y + j * GRID_SIZE);
        var target = self.getPanel(pos);
        if (target && target.isBomb) bombs++;
      });
    });
    // パネルに数を表示
    panel.num = bombs === 0 ? '' : bombs;
    Label({
      text: panel.num,
      fill: 'white',
    }).addChildTo(panel);
    panel.fill = 'gray';
    // 周りに爆弾がなければ再帰的に調べる
    if (bombs === 0) {
      indexs.each(function(i) {
        indexs.each(function(j) {
          var pos = Vector2(panel.x + i * GRID_SIZE, panel.y + j * GRID_SIZE);
          var target = self.getPanel(pos);
          target && self.openPanel(target);
        });
      });
    }
  },
  // 指定された位置のパネルを得る
  getPanel: function(pos) {
    var result = null;
    
    this.panelGroup.children.some(function(panel) {
      if (panel.position.equals(pos)) {
        result = panel;
        return true;
      } 
    });
    return result;
  },
  // 爆弾を全て表示する
  showAllBombs: function() {
    var self = this;
    
    this.panelGroup.children.each(function(panel) {
      panel.setInteractive(false);
      
      if (panel.isBomb) {
        Bomb().addChildTo(panel);
        panel.tweener.clear().scaleTo(1.2, 100)
                     .scaleTo(1.0, 100)
                     .call(function() {
                       // ラベル表示
                       Label({
                        text: 'TOUCH TO RESTART',
                        fill: 'white',
                       }).addChildTo(self).setPosition(320, 700);
                       // 画面をタッチ可能に
                       self.setInteractive(true);
                     });
      }
    });
  },
});
// パネルクラス
phina.define('Panel', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        width: PANEL_SIZE,
        height: PANEL_SIZE,
        fill: 'silver', // 塗りつぶし色
        stroke: 'white', // 枠の色
        cornerRadius: 2, // 角の丸み
      });
      // 開かれているかどうか
      this.isOpen = false;
      // マークつけれているかどうか
      this.isMark = false;
      // タッチ有効化
      this.setInteractive(true);
    },
});
// 爆弾クラス
phina.define('Bomb', {
  // Shapeを継承
  superClass: 'Shape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        width: GRID_SIZE,
        height: GRID_SIZE,
        backgroundColor: 'transparent',
      });
      // 導線
      RectangleShape({
        width: PANEL_SIZE / 8,
        height: PANEL_SIZE / 8,
        fill: "navy",
        stroke: 'white',
        y: -20,
      }).addChildTo(this);
      // 本体
      CircleShape({
        radius: PANEL_SIZE / 4,
        fill: "navy",
        stroke: 'white',
      }).addChildTo(this);
    },
});
// 爆発クラス
phina.define('Explosion', {
  // StarShapeを継承
  superClass: 'StarShape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        radius: (PANEL_SIZE + 5) / 2,
        sides: 10,
        sideIndent: 0.75,
        rotation: 15,
        fill: "red",
        stroke: "yellow",
      });
    },
});
// マーククラス
phina.define('Mark', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        width: PANEL_SIZE / 10,
        height: PANEL_SIZE,
        fill: "red",
        stroke: "red",
        rotation: 45,
      });
      
      CircleShape({
        width: PANEL_SIZE,
        height: PANEL_SIZE,
        fill: "transparent",
        stroke: "red",
        strokeWidth: PANEL_SIZE / 10,
      }).addChildTo(this);
    },
});
// メイン
phina.main(function() {
  var app = GameApp({
    startLabel: 'main', // メイン画面からスタート
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  app.run();
});