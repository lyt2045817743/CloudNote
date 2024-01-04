module.exports = {
  title: "婷的笔记",
  themeConfig: {
    logo: "/assets/img/logo.png",
    repo: "https://github.com/lyt2045817743/CloudNote",
    sidebar: {
      '/frontend/': [
        {
          title: '前端基础',   // 必要的
          collapsable: false, // 可选的, 默认值是 true,
          sidebarDepth: 2,    // 可选的, 默认值是 1
          children: [
            '/frontend/base/html_css/',
            '/frontend/base/js/'
          ]
        },
        {
          title: '前端进阶',
          collapsable: false, // 可选的, 默认值是 true,
          sidebarDepth: 2,    // 可选的, 默认值是 1
          children: [
            '/frontend/premium/browser/',
            '/frontend/premium/code/'
          ],
        }
      ],
    },
    nav: [
      { text: "首页", link: "/" },
      {
        text: "前端体系",
        items: [
          {
            text: "基础知识",
            items: [
              { text: "HTML&CSS", link: "/frontend/base/html_css/" },
              { text: "JS", link: "/frontend/base/js/" },
            ],
          },
          {
            text: "进阶",
            items: [
              { text: "浏览器", link: "/frontend/premium/browser/" },
              { text: "代码优化", link: "/frontend/premium/code/" },
              { text: "工程化", link: "/frontend/premium/engineering/" },
            ],
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
        ],
      },
      {
        text: "成长",
        items: [{ text: "学习方法", link: "/growth/study/" }],
      },
    ],
  },
};
