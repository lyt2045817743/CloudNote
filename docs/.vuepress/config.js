const { getChildren } = require("./utils");
module.exports = {
  title: "婷的笔记",
  themeConfig: {
    logo: "/assets/img/logo.png",
    repo: "https://github.com/lyt2045817743/CloudNote",
    sidebar: {
      '/frontend/': [
        {
          title: '前端基础',   // 必要的
          sidebarDepth: 2,    // 可选的, 默认值是 1
          children: [
            '/frontend/base/html_css/',
            '/frontend/base/js/',
            '/frontend/base/vue/'
          ]
        },
        {
          title: '前端进阶',
          sidebarDepth: 2,    // 可选的, 默认值是 1
          children: [
            '/frontend/premium/browser/',
            '/frontend/premium/code/',
            '/frontend/premium/engineering/',
            '/frontend/premium/performance/',
            '/frontend/premium/mobile/'
          ],
        }
      ],
      '/summary/': [
        {
          title: '每日一捡',
          sidebarDepth: 2,
          children: [
            {
              title: '2024年',
              children: [
                '/summary/everyday/2024/04'
              ]
            },
          ]
        },
        {
          title: '项目总结',
          children: [
            '/summary/project/',
            {
              title: "小米",
              children: [
                '/summary/project/@mi/live',
                '/summary/project/@mi/rn',
                '/summary/project/@mi/qiankun',
              ]
            }
          ]
        }
      ]
    },
    nav: [
      { text: "首页", link: "/" },
      {
        text: "前端体系",
        items: [
          {
            text: "基础",
            link: "/frontend/base/html_css/html",
          },
          {
            text: "进阶",
            link: "/frontend/premium/browser/",
          },
        ],
      },
      {
        text: "经验总结",
        items: [
          {
            text: "每天一捡",
            link: "/summary/everyday/2024/04.md",
          },
          { text: "项目总结", link: "/summary/project/" },
        ],
      },
      {
        text: "成长",
        items: [{ text: "学习方法", link: "/growth/study/" }],
      },
    ],
  },
};
