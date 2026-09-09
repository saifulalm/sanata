import { getRabList, getMultiSchedule } from "@/lib/adminResources";
import MultiScheduleClient from "./MultiScheduleClient";

export const metadata = { title: "Perbandingan Kurva S — Multi RAB" };

export default async function MultiSchedulePage() {
  // Fetch RAB list for selection - use page 1 with default pageSize of 10
  // We need to fetch multiple pages to get up to 100 RABs
  const page1 = await getRabList({ page: 1 });
  const page2 = await getRabList({ page: 2 });
  const page3 = await getRabList({ page: 3 });
  const rabList = [...page1.data, ...page2.data, ...page3.data].slice(0, 100);

  // Fetch multi schedule data if there are RABs
  const rabIds = rabList.slice(0, 5).map((r) => r.id);
  const multiScheduleData = rabIds.length > 0 ? await getMultiSchedule(rabIds) : null;

  return (
    <MultiScheduleClient
      rabList={rabList}
      initialSelectedIds={rabIds}
      multiScheduleData={multiScheduleData}
    />
  );
}
