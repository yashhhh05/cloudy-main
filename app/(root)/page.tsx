import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";

import { UsageChart } from "@/components/UsageChart";
import { getFiles, getTotalSpaceUsed } from "@/lib/file.actions";
import { convertFileSize, getUsageSummary } from "@/lib/utils";
import Card from "@/components/Card";
import FormattedDateTime from "@/components/FormattedDateTime";
import { getCurrentUserData } from "@/lib/actions/user.actions";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const Dashboard = async () => {
  const [files, totalSpace, currentUser] = await Promise.all([
    getFiles({ types: [], limit: 10 }),
    getTotalSpaceUsed(),
    getCurrentUserData(),
  ]);

  const usageSummary = getUsageSummary(totalSpace);

  return (
    <div className="dashboard-container">
      <section>
        <UsageChart used={totalSpace.used} />

        {/* Parallelly upload file */}
        <ul className="dashboard-summary-list">
          {usageSummary.map((summary) => (
            <Link
              href={summary.url}
              key={summary.title}
              className="dashboard-summary-card"
            >
              <div className="space-y-4">
                <div className="flex justify-between gap-3">
                  <Image
                    src={summary.icon}
                    width={100}
                    height={100}
                    alt="uploaded image"
                    className="summary-type-icon"
                  />
                  <h4 className="summary-type-size">
                    {convertFileSize(summary.size) || 0}
                  </h4>
                </div>

                <h5 className="summary-type-title">{summary.title}</h5>
                <Separator className="bg-light-400" />
                <FormattedDateTime
                  date={summary.latestDate}
                  className="summary-type-date"
                />
              </div>
            </Link>
          ))}
        </ul>
      </section>

      {/* Recent files uploaded */}
      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
        {files.documents.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-5">
            {files.documents.map((file: Models.Document) => (
              <Card key={file.$id} file={file} currentUser={currentUser} />
            ))}
          </ul>
        ) : (
          <p className="empty-list">No files uploaded</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;