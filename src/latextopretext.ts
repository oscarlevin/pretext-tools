function convertParagraph(text: string) {
	//convert empty lines to paragraph
	let result = text.replace(/(\r|\n(?!\r|\n))(.*?)((\r|\n)\s*?(\r|\n))/gs, "<p>\n$2\n</p>\n\n");
	return result;
}

function convertMath(text: string) {
	//convert diplay math mode
	let result = text.replace(/(\${2}|\\\[|\\begin{displaymath}|\\begin{equation})(.*?)(\${2}|\\\]|\\end{displaymath}|\\end{equation})/gs, "<me>$2</me>");
	//convert inline math mode
	result = result.replace(/((?<!\\)\$|\\\(|\\begin{math})(.*?)((?<!\\)\$|\\\)|\\end{math})/gs, "<m>$2</m>");
	
	return result;
}
function convertTextMarkup(text: string) {
	//Convert verbatim
	let result = text.replace(/(\\verb\||\\begin{verbatim})(.*?)(\||\\end{verbatim})/gs, "<c>$2</c>");
	//convert emphasis/italics
	result = result.replace(/(\\emph{|\\textit{)(.*?)(})/gs, "<em>$2</em>");
	//convert boldface
	result = result.replace(/(\\textbf{)(.*?)(})/gs, "<term>$2</term>");

	return result;
}
function convertQuotation(text: string) {
	//convert double quote
	let result = text.replace(/(``|")(.*?)(''|")/gs, "<q>$2</q>");
	
	//convert single quote
	result = result.replace(/(`|')(.*?)(')/gs, "<sq>$2</sq>");
	return result;
}

//calls each conversion in extension
export function latexToPretext(text: string) {
	var result = text;

	//result = convertParagraph(result);
	result = convertMath(result);
	result = convertTextMarkup(result);
	result = convertQuotation(result);

	return result;
}