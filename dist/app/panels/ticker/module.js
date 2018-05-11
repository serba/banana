/*! banana-fusion-snapshot - v0.1.1 - 2018-05-11
 * https://github.com/LucidWorks/banana/wiki
 * Copyright (c) 2018 Andrew Thanalertvisuti; Licensed Apache-2.0 */

define("panels/ticker/module",["angular","app","underscore","kbn"],function(a,b,c,d){"use strict";var e=a.module("kibana.panels.ticker",[]);b.useModule(e),e.controller("ticker",["$scope","$q","kbnIndex","querySrv","dashboard","filterSrv",function(b,e,f,g,h,i){function j(a,d,e,f){if(b.panelMeta.loading=!1,!c.isUndefined(a.error))return void(b.panel.error=a.error.msg);if(!c.isUndefined(d.error))return void(b.panel.error=d.error.msg);b.hits={};var h={"new":a.facet_counts.facet_ranges[i.getTimeField()].between,old:d.facet_counts.facet_ranges[i.getTimeField()].between};b.hits=h;var j=null==l(h.old,h["new"])?"?":Math.round(100*l(h.old,h["new"]))/100;b.data[f]={info:g.list[e],hits:{"new":h["new"],old:h.old},percent:j},b.trends=b.data}function k(a,b){var c=864e5;return Math.round(Math.abs((b.getTime()-a.getTime())/c))+1}function l(a,b){return 0===a?null:100*(b-a)/a}b.panelMeta={modals:[{description:"Inspect",icon:"icon-info-sign",partial:"app/partials/inspector.html",show:b.panel.spyable}],editorTabs:[{title:"Queries",src:"app/partials/querySelect.html"}],status:"Beta",description:'A stock-ticker style representation of how queries are moving over time. For example, if the time is 1:10pm, your time picker was set to "Last 10m", and the "Time Ago" parameter was set to \'1h\', the panel would show how much the query results have changed since 12:00-12:10pm'};var m={queries:{mode:"all",ids:[]},style:{"font-size":"14pt"},ago:"1d",arrangement:"vertical",spyable:!0,show_queries:!0};c.defaults(b.panel,m),b.init=function(){b.hits=0,b.$on("refresh",function(){b.get_data()}),b.get_data()},b.get_data=function(f){if(delete b.panel.error,b.panelMeta.loading=!0,0!==h.indices.length){b.index=f>0?b.index:h.indices,b.sjs.client.server(h.current.solr.server+h.current.solr.core_name),b.panel.queries.ids=g.idsByMode(b.panel.queries);var l=c.uniq(c.pluck(i.getByType("time"),"field"));if(l.length>1)return void(b.panel.error="Time field must be consistent amongst time filters");if(0===l.length)return void(b.panel.error="A time filter must exist for this panel to function");l=l[0],b.time=i.timeRange("min"),b.old_time={from:new Date(b.time.from.getTime()-d.interval_to_ms(b.panel.ago)),to:new Date(b.time.to.getTime()-d.interval_to_ms(b.panel.ago))};var m=b.sjs.Request().indices(h.indices),n=c.difference(i.ids,i.idsByType("time"));c.each(b.panel.queries.ids,function(a){var c=b.sjs.FilteredQuery(g.getEjsObj(a),i.getBoolFilter(n).must(b.sjs.RangeFilter(l).from(b.time.from).to(b.time.to)));m=m.facet(b.sjs.QueryFacet(a).query(c)).size(0)}),c.each(b.panel.queries.ids,function(a){var c=b.sjs.FilteredQuery(g.getEjsObj(a),i.getBoolFilter(n).must(b.sjs.RangeFilter(l).from(b.old_time.from).to(b.old_time.to)));m=m.facet(b.sjs.QueryFacet("old_"+a).query(c)).size(0)}),b.inspector=a.toJson(JSON.parse(m.toString()),!0);var o="";i.getSolrFq(!0)&&(o="&"+i.getSolrFq(!0));var p=i.getTimeField(),q="&wt=json",r="&rows=0",s="%2B"+k(b.time.from,b.time.to)+"DAY",t="&facet=true&facet.range="+p+"&facet.range.start="+b.time.from.toISOString()+"&facet.range.end="+b.time.to.toISOString()+"&facet.range.gap="+s+"&facet.range.hardend=true&facet.range.other=between",u="%2B"+k(b.old_time.from,b.old_time.to)+"DAY",v="&facet=true&facet.range="+p+"&facet.range.start="+b.old_time.from.toISOString()+"&facet.range.end="+b.old_time.to.toISOString()+"&facet.range.gap="+u+"&facet.range.hardend=true&facet.range.other=between",w=[];b.panel.queries.query="",c.each(b.panel.queries.ids,function(a){var c,d=g.getQuery(a)+q+r+o+t,e=g.getQuery(a)+q+r+o+v;c=null!=b.panel.queries.custom?m.setQuery(d+b.panel.queries.custom):m.setQuery(d),b.panel.queries.query+=d+"\n\n",w.push(c.doSearch());var f;f=null!=b.panel.queries.custom?m.setQuery(e+b.panel.queries.custom):m.setQuery(e),b.panel.queries.query+=e+"\n",w.push(f.doSearch()),b.panel.queries.query+="-----------\n"}),b.data=[],h.current.services.query.ids.length>=1&&e.all(w).then(function(a){c.each(b.panel.queries.ids,function(d,e){return c.isUndefined(a[e].error)?void j(a[2*e],a[2*e+1],d,e):void(b.panel.error=b.parse_error(a[e].error.msg))})})}},b.set_refresh=function(a){b.refresh=a},b.close_edit=function(){b.refresh&&b.get_data(),b.refresh=!1,b.$emit("render")}}])});