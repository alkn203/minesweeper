phina.globalize();
// 定数
var PANEL_SIZE = 64; // パネルサイズ
var PANEL_NUM_XY = 9; // 縦横のパネル数
var SCREEN_SIZE = PANEL_SIZE * PANEL_NUM_XY; // 画面縦横サイズ
var PANEL_OFFSET = PANEL_SIZE / 2; // オフセット値
var BOMB_NUM = 10; // 爆弾数
// アセット
var ASSETS = {
  // 画像
  image: {
    'minespsheet': 'https://cdn.jsdelivr.net/gh/alkn203/minesweeper@main/assets/minespsheet.png',
  },
};
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function(options) {
    // 親クラス初期化
    this.superInit(options);
    // グリッド
    var grid = Grid(SCREEN_SIZE, PANEL_NUM_XY);
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
          // パネルを開く
          self.openPanel(panel);
          // クリア判定
          self.checkClear();
        };
      });
    });
    // 参照用
    this.panelGroup = panelGroup;
    // クリア判定用
    this.oCount = 0;
  },
  // クリア判定
  checkClear: function() {
    if (this.oCount === PANEL_NUM_XY * PANEL_NUM_XY - BOMB_NUM) {
      // パネルを選択不可に
      this.panelGroup.children.each(function(panel) {
        panel.setInteractive(false);
      });
    }
  },
  // パネルを開く処理
  openPanel: function(panel) {
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
        var pos = Vector2(panel.x + i * PANEL_SIZE, panel.y + j * PANEL_SIZE);
        var target = self.getPanel(pos);
        if (target && target.isBomb) {
          bombs++;
        }
      });
    });
    // パネルに数を表示
    panel.num = bombs === 0 ? '' : bombs;
    // 周りに爆弾がなければ再帰的に調べる
    if (bombs === 0) {
      indexs.each(function(i) {
        indexs.each(function(j) {
          var pos = Vector2(panel.x + i * PANEL_SIZE, panel.y + j * PANEL_SIZE);
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
      }
    });
  },
});
// パネルクラス
phina.define('Panel', {
  // Spriteクラスを継承
  superClass: 'Sprite',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit('minespsheet', PANEL_SIZE, PANEL_SIZE);
      // 開かれているかどうか
      this.isOpen = false;
      // タッチ有効化
      this.setInteractive(true);
      // 初期表示
      this.setFrameIndex(10);
    },
});
// メイン
phina.main(function() {
  var app = GameApp({
    // メイン画面からスタート
    startLabel: 'main', 
    width: SCREEN_SIZE,
    height: SCREEN_SIZE,
    // ウィンドウにフィット
    fit: false,
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});