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
          title: '2024年',
          sidebarDepth: 2,
          children: [
            '/summary/review/everyday/2024/04'
          ]
        },
      ]
    },
    nav: [
      { text: "首页", link: "/" },
      {
        text: "前端体系",
        items: [
          {
            text: "基础",
            link: "/frontend/base/html_css/",
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
            text: "编程Coding",
            items: [
              { text: "项目", link: "/summary/code/project/" },
            ],
          },
          {
            text: "复习",
            items: [
              {
                text: "每天一捡",
                link: "/summary/review/everyday/2024/04.md",
              },
            ]
          }
        ],
      },
      {
        text: "成长",
        items: [{ text: "学习方法", link: "/growth/study/" }],
      },
    ],
  },
};
