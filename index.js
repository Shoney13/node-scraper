import * as cheerio from "cheerio";
import axios from "axios";
import fs from "fs";

const baseUrl = "https://webscraper.io";

const scrapePaths = async (url) => {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await axios.get(baseUrl + url);
			const $ = cheerio.load(res.data);
			const paths = [];
			$("#side-menu li a").each((i, e) => {
				paths.push(e.attribs.href);
			});

			for (let i = 0; i < paths.length; i++) {
				const element = paths[i];
				console.log("waiting for", element);
				await scrapeAll(element);
				const res = await axios.get(baseUrl + element);
				const $ = cheerio.load(res.data);
				const childPath = [];
				$("#side-menu li ul li a").each((i, e) => {
					childPath.push(e.attribs.href);
				});
				for (let j = 0; j < childPath.length; j++) {
					const childElem = childPath[j];
					console.log("waiting for", element, childElem);
					await scrapeAll(childElem);
				}
			}
		} catch (error) {
			console.error(error);
		}
		resolve();
	});
};

const scrapeAll = async (url) => {
	return new Promise(async (resolve, reject) => {
		try {
			const res = await axios.get(baseUrl + url);
			const $ = cheerio.load(res.data);
			const productArr = [];
			$(".thumbnail .caption").each(function () {
				const price = $(this).find("h4.price").text();
				const title = $(this).find("h4 a.title").text();
				const link = baseUrl + $(this).find("h4 a.title").attr("href");
				const description = $(this).find("p.description").text();

				productArr.push({ price, description, title, link });
			});

			const file = fs.createWriteStream("data.txt", { flags: "a" });

			file.on("error", function (err) {
				console.error(err);
			});

			productArr.forEach(({ price, description, title, link }) => {
				file.write(`
          ${title} ${price} \n
          ${description} \n
          ${link} \n\n
          `);
			});
			file.end();
			resolve();
		} catch (error) {
			console.error(error);
		}
	});
};

scrapePaths("/test-sites/e-commerce/allinone");
