interface Category {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

interface Link {
  id: string;
  category_id: string;
  title: string;
  url: string;
  description: string | null;
  link_type: string;
  click_count: number;
}

interface ExportData {
  categories: Category[];
  links: Link[];
}

export function exportToCSV(data: ExportData, filename: string) {
  const { categories, links } = data;

  // 创建CSV内容
  const csvRows: string[] = [];

  // 表头
  csvRows.push('分类名称,分类图标,链接标题,链接地址,链接描述,链接类型,访问次数');

  // 数据行
  categories.forEach((category) => {
    const categoryLinks = links.filter((link) => link.category_id === category.id);

    if (categoryLinks.length === 0) {
      csvRows.push(`"${category.name}","${category.icon || ''}","","","","",0`);
    } else {
      categoryLinks.forEach((link) => {
        csvRows.push(
          `"${category.name}","${category.icon || ''}","${link.title}","${link.url}","${
            link.description || ''
          }","${link.link_type}",${link.click_count}`
        );
      });
    }
  });

  // 创建Blob并下载
  const csvContent = '\uFEFF' + csvRows.join('\n'); // 添加BOM以支持中文
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: ExportData, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}